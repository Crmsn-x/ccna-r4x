import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    const store = getStore();
    const question = await store.getQuestionById(id);

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, question });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
