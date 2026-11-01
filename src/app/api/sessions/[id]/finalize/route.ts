import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';

export async function POST(
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

    // In Assess mode, submit any saved drafts that haven't been submitted yet
    if (session.mode === 'assess' && session.status === 'active') {
      const existingSubmissions = await store.getSubmittedResponses(id);
      const submittedIds = new Set(existingSubmissions.map(s => s.questionId));

      for (const questionId of session.questionIds) {
        if (!submittedIds.has(questionId)) {
          const draft = await store.getDraftResponse(id, questionId);
          if (draft && draft.answer) {
            await store.submitResponse({
              sessionId: id,
              questionId,
              answer: draft.answer,
              confidence: draft.confidence || 'unsure',
              flagged: draft.flagged,
            });
          }
        }
      }
    }

    const finalizedSession = await store.finalizeSession(id);
    const submittedResponses = await store.getSubmittedResponses(id);

    return NextResponse.json({
      success: true,
      session: finalizedSession,
      submittedResponses,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
