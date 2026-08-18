// --- AI Translation Endpoint ------------------------------------------------------------------
// Translates meeting content using LLM from z-ai-web-dev-sdk.
// Supports 10 languages with professional translation quality.
// Task ID: phase6-ai-backend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitize, validateUuidOptional, SecurityError } from '@/lib/security';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ar', 'hi'];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { text, targetLanguage, meetingId } = body;

    // --- Validate required fields ----------------------------------------------
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Text to translate is required' } },
        { status: 400 }
      );
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'targetLanguage is required' } },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` } },
        { status: 400 }
      );
    }

    const safeMeetingId = validateUuidOptional(meetingId);

    // Sanitize text — truncate to 10000 chars for LLM context
    const sanitizedText = inputSanitize(text, 10000, 'text');

    // --- Call LLM for translation ---------------------------------------------
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLangName}. Only return the translated text, nothing else. Preserve formatting and paragraph structure.`,
        },
        { role: 'user', content: sanitizedText },
      ],
      max_tokens: 2000,
    });

    const translatedText = completion.choices?.[0]?.message?.content || '';

    // --- Audit log -----------------------------------------------------------
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_TRANSLATE',
        resource: 'Translation',
        resourceId: safeMeetingId || undefined,
        details: `Translated text to ${targetLangName}${safeMeetingId ? ` for meeting ${safeMeetingId}` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        translatedText,
        sourceLanguage: 'auto',
        targetLanguage,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    const msg = error instanceof Error ? error.message : 'Translation service temporarily unavailable';
    console.error('AI translate error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
