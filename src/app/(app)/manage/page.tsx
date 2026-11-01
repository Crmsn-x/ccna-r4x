import { getStore } from '@/server/store';
import { ManageClient } from './ManageClient';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const store = getStore();
  const [questions, tags] = await Promise.all([
    store.getQuestions({ includeDevFixtures: true }),
    store.getTags(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl py-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          System &amp; Content Management
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Diagnostics, content audit queues, course module mappings, and developer controls.
        </p>
      </div>

      <ManageClient questions={questions} tags={tags} />
    </div>
  );
}
