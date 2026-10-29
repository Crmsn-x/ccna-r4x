import { getStore } from '@/server/store';
import { BankExplorer } from './BankExplorer';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage() {
  const store = getStore();
  const [questions, tags] = await Promise.all([
    store.getQuestions({ includeDevFixtures: true }), // Include dev fixtures in bank for inspection
    store.getTags(),
  ]);

  return <BankExplorer initialQuestions={questions} tags={tags} />;
}
