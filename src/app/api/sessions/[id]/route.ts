import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    const session = await store.getSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: `Session ${id} not found` },
        { status: 404 }
      );
    }

    const allSubmitted = await store.getSubmittedResponses(id);
    
    // In active Assess sessions, withhold answer keys and explanations
    const submittedResponses = session.mode === 'assess' && session.status === 'active'
      ? allSubmitted.map(sub => ({
          ...sub,
          markingResult: {
            ...sub.markingResult,
            correctAnswerSummary: undefined,
            explanation: undefined,
          },
        }))
      : allSubmitted;

    // Load drafts for each question in this session
    const drafts: Record<string, unknown> = {};
    for (const qId of session.questionIds) {
      const draft = await store.getDraftResponse(id, qId);
      if (draft) {
        drafts[qId] = draft;
      }
    }

    return NextResponse.json({
      success: true,
      session,
      submittedResponses,
      drafts,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
