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

  async *streamMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async complete(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model ?? this.model,
      max_tokens: options?.maxTokens ?? 2048,
      system,
      messages,
    });
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

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this CBT therapy session:\n\n${conversationText}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : '{}';
  }
}
