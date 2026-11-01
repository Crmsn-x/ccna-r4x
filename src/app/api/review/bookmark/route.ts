import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body as { questionId: string };

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId is required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const state = await store.toggleBookmark(questionId);

    return NextResponse.json({ success: true, state });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
