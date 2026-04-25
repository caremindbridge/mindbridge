import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(ClaudeService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('anthropic.apiKey');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY is not set — AI features will be unavailable');
    }
    this.client = new Anthropic({ apiKey: apiKey || 'not-configured' });
    this.model = this.configService.get<string>('anthropic.model')!;
  }

  private isRetryable(error: unknown): boolean {
    return error instanceof Anthropic.APIError && (error.status === 529 || error.status === 429);
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 4, baseDelayMs = 1000): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (this.isRetryable(error) && attempt < retries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          this.logger.warn(
            `Anthropic overloaded/rate-limited (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Unreachable');
  }

  async *streamMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): AsyncGenerator<string> {
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const stream = this.client.messages.stream({
          model: this.model,
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield event.delta.text;
          }
        }
        return;
      } catch (error) {
        if (this.isRetryable(error) && attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt);
          this.logger.warn(
            `Anthropic overloaded/rate-limited during stream (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  async complete(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<string> {
    const response = await this.withRetry(() =>
      this.client.messages.create({
        model: options?.model ?? this.model,
        max_tokens: options?.maxTokens ?? 2048,
        system,
        messages,
      }),
    );
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : '';
  }

  // TODO (Option 2 — proactive summarization): instead of compressing at analysis time,
  // create rolling interim summaries in Redis as the session grows (e.g. every 50 messages
  // in sendMessage()). At analysis time, use [interim_summaries] + [last LAST_KEEP messages].
  // This avoids the extra API call at the end and gives richer coverage of long sessions.
  // See: ChatService.sendMessage() — a good place to trigger background summarization.
  async generateAnalysis(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const FIRST_KEEP = 15; // always include session opening (how the patient entered)
    const LAST_KEEP = 40;  // always include session closing (resolution, homework, current state)
    // Only compress if there's a meaningful middle section to summarize
    const COMPRESS_THRESHOLD = FIRST_KEEP + LAST_KEEP + 10;
    // Cap middle sent to summarizer — if session is extremely long, sample first+last halves
    const MAX_MIDDLE_FOR_SUMMARY = 200;

    const contextText = await this.buildAnalysisContext(
      messages,
      FIRST_KEEP,
      LAST_KEEP,
      COMPRESS_THRESHOLD,
      MAX_MIDDLE_FOR_SUMMARY,
    );

    const controller = new AbortController();
    // 10-minute hard cap — two-pass analysis needs more time than single-pass
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      const response = await this.withRetry(() =>
        this.client.messages.create(
          {
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Analyze this CBT therapy session:\n\n${contextText}` }],
          },
          { signal: controller.signal },
        ),
      );

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock ? textBlock.text : '{}';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async buildAnalysisContext(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    firstKeep: number,
    lastKeep: number,
    compressThreshold: number,
    maxMiddleForSummary: number,
  ): Promise<string> {
    const toText = (msgs: Array<{ role: string; content: string }>) =>
      msgs.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    if (messages.length <= compressThreshold) {
      return toText(messages);
    }

    const first = messages.slice(0, firstKeep);
    const middle = messages.slice(firstKeep, -lastKeep);
    const last = messages.slice(-lastKeep);

    // If the middle is itself huge, sample first + last halves so the summary call stays under limits
    const middleForSummary =
      middle.length > maxMiddleForSummary
        ? [
            ...middle.slice(0, maxMiddleForSummary / 2),
            ...middle.slice(-(maxMiddleForSummary / 2)),
          ]
        : middle;

    this.logger.warn(
      `Long session: ${messages.length} messages. Summarizing middle (${middle.length} msgs, ` +
        `sending ${middleForSummary.length} to summarizer). First: ${firstKeep}, Last: ${lastKeep}.`,
    );

    const summaryResponse = await this.withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system:
          'You are a clinical CBT session analyst. Compress the provided therapy session excerpt into a detailed narrative summary (600–900 words). ' +
          'Preserve: key themes, cognitive distortions identified (with examples), emotional peaks and turning points, ' +
          'any risk indicators or crisis moments, patient resistance or breakthroughs, and coping strategies discussed. ' +
          'Write in past tense as a clinical narrative. Do not omit safety-relevant content.',
        messages: [{ role: 'user', content: toText(middleForSummary) }],
      }),
    );

    const summary =
      summaryResponse.content.find((b) => b.type === 'text')?.text ??
      '(middle section unavailable)';

    return [
      toText(first),
      `\n\n[SESSION MIDDLE — SUMMARIZED (${middle.length} messages)]\n${summary}\n[END OF SUMMARY]\n`,
      toText(last),
    ].join('\n\n');
  }
}
