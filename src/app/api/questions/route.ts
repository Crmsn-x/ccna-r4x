import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';
import type { QuestionStatus, QuestionType } from '@/domain/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || undefined) as QuestionType | undefined;
    const status = (searchParams.get('status') || undefined) as QuestionStatus | undefined;
    const tagId = searchParams.get('tagId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeDevFixtures = searchParams.get('includeDevFixtures') === 'true';

    const store = getStore();
    const questions = await store.getQuestions({
      type,
      status,
      tagId,
      search,
      includeDevFixtures,
    });

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
