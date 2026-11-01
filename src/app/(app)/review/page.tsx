import { getStore } from '@/server/store';
import { ReviewClient } from './ReviewClient';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const store = getStore();
  const [questions, tags, submittedResponses, reviewStates, dueStates] = await Promise.all([
    store.getQuestions({ includeDevFixtures: true }),
    store.getTags(),
    store.getSubmittedResponses(),
    store.getReviewStates(),
    store.getDueReviews(),
  ]);

  return (
    <div className="w-full">
      <ReviewClient
        questions={questions}
        tags={tags}
        submittedResponses={submittedResponses}
        reviewStates={reviewStates}
        dueStates={dueStates}
      />
    </div>
  );
}
