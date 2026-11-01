import { getStore } from '@/server/store';
import { BankExplorer } from './BankExplorer';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage() {
  const store = getStore();
  const [questions, tags, reviewStates] = await Promise.all([
    store.getQuestions({ includeDevFixtures: true }), // Include dev fixtures in bank for inspection
    store.getTags(),
    store.getReviewStates(),
  ]);

  const initialBookmarkedIds = reviewStates
    .filter((r) => r.bookmarked)
    .map((r) => r.questionId);

  return (
    <BankExplorer
      initialQuestions={questions}
      tags={tags}
      initialBookmarkedIds={initialBookmarkedIds}
    />
  );
}
