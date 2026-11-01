import { notFound } from 'next/navigation';
import { getStore } from '@/server/store';
import { PracticeRunner } from './PracticeRunner';
import type { DraftResponse } from '@/domain/types';

export const dynamic = 'force-dynamic';

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const store = getStore();

  const session = await store.getSession(sessionId);
  if (!session) {
    notFound();
  }

  const allSubmitted = await store.getSubmittedResponses(sessionId);

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

  // Load saved drafts for session questions
  const drafts: Record<string, DraftResponse> = {};
  for (const qId of session.questionIds) {
    const draft = await store.getDraftResponse(sessionId, qId);
    if (draft) {
      drafts[qId] = draft;
    }
  }

  return (
    <PracticeRunner
      initialSession={session}
      initialSubmittedResponses={submittedResponses}
      initialDrafts={drafts}
    />
  );
}
