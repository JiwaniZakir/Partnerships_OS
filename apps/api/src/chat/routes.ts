import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { processMessage } from './agent.js';
import { logger } from '../utils/logger.js';

const messageSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  intent: z.string().optional(),
});

const transcribeSchema = z.object({
  audio: z.string().min(1),
  mimeType: z.string().default('audio/m4a'),
});

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  // Stateless chat message endpoint
  app.post(
    '/chat/message',
    { preHandler: [requireAuth] },
    async (request) => {
      const { message, conversationHistory, intent } = messageSchema.parse(
        request.body
      );

      logger.info(
        {
          memberId: request.member.sub,
          messageLength: message.length,
          historyLength: conversationHistory.length,
          intentHint: intent,
        },
        'Chat message received'
      );

      const result = await processMessage(
        message,
        request.member.sub,
        request.member.name,
        request.member.role,
        conversationHistory,
        intent
      );

      return result;
    }
  );

  // Transcribe audio via OpenAI Whisper
  app.post(
    '/chat/transcribe',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { audio, mimeType } = transcribeSchema.parse(request.body);

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        reply.status(503);
        return { error: 'Transcription service unavailable' };
      }

      try {
        const audioBuffer = Buffer.from(audio, 'base64');
        const extMap: Record<string, string> = {
          'audio/m4a': 'm4a',
          'audio/mp4': 'm4a',
          'audio/mpeg': 'mp3',
          'audio/wav': 'wav',
          'audio/webm': 'webm',
        };
        const ext = extMap[mimeType] || 'm4a';

        const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
        const formData = new FormData();
        formData.append('file', blob, `recording.${ext}`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });

        if (!res.ok) {
          const body = await res.text();
          logger.error({ status: res.status, body }, 'OpenAI Whisper STT failed');
          reply.status(503);
          return { error: 'Transcription service error' };
        }

        const data = (await res.json()) as { text?: string };
        const transcript = data.text?.trim() || '';

        logger.info(
          { memberId: request.member.sub, length: transcript.length },
          'Audio transcribed via Whisper'
        );

        return { transcript };
      } catch (err) {
        logger.error({ err }, 'Transcription error');
        reply.status(500);
        return { error: 'Transcription failed' };
      }
    }
  );
}
