import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';
import type { ClientAnswer, ConfidenceLevel } from '@/domain/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { questionId, answer, confidence, flagged } = body as {
      questionId: string;
      answer: ClientAnswer;
      confidence: ConfidenceLevel;
      flagged?: boolean;
    };

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId is required' },
        { status: 400 }
      );
    }

    if (!confidence || !['confident', 'unsure', 'guessed'].includes(confidence)) {
      return NextResponse.json(
        { success: false, error: 'Confidence level ("confident", "unsure", "guessed") is required before submission' },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { success: false, error: 'answer is required' },
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

    // Submit and mark deterministically
    const submittedResponse = await store.submitResponse({
      sessionId: id,
      questionId,
      answer,
      confidence,
      flagged,
    });

    // In Assess mode, withhold answer key and explanation until finalization
    if (session.mode === 'assess') {
      return NextResponse.json({
        success: true,
        submittedResponse: {
          ...submittedResponse,
          markingResult: {
            ...submittedResponse.markingResult,
            correctAnswerSummary: undefined,
            explanation: undefined,
          },
        },
      });
    }

    // In Learn mode, return complete marking result and explanation
    return NextResponse.json({
      success: true,
      submittedResponse,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
