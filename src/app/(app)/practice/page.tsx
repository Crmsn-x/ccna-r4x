import { getStore } from '@/server/store';
import { PracticeSetup } from './PracticeSetup';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const store = getStore();
  const [allQuestions, tags, sessions] = await Promise.all([
    store.getQuestions({ includeDevFixtures: true }),
    store.getTags(),
    store.listSessions(),
  ]);

  const activeSession = sessions.find(s => s.status === 'active') || null;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 h-full">
      <PracticeSetup questions={allQuestions} tags={tags} activeSession={activeSession} />
    </div>
  );
}
