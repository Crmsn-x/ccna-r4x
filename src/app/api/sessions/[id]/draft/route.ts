import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';
import type { ClientAnswer, ConfidenceLevel } from '@/domain/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { questionId, answer, confidence, flagged } = body as {
      questionId: string;
      answer?: ClientAnswer;
      confidence?: ConfidenceLevel;
      flagged?: boolean;
    };

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId is required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const session = await store.getSession(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: `Session ${id} not found` },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `Session ${id} is already ${session.status}` },
        { status: 400 }
      );
    }

    // Save draft response (pure persistence, does not mark or change Leitner scheduling)
    const draft = await store.saveDraftResponse({
      sessionId: id,
      questionId,
      answer,
      confidence,
      flagged,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, draft });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
