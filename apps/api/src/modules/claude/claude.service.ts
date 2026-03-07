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

  async generateAnalysis(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const response = await this.withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze this CBT therapy session:\n\n${conversationText}`,
          },
        ],
      }),
    );

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : '{}';
  }
}
