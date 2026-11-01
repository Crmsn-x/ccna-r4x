import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('ingestion/ccna_trial_import_200.json', 'utf8'));
const topics = new Set();
for (const q of data.questions) {
  if (q.domainTopic) topics.add(q.domainTopic);
}

console.log('Total non-null domainTopics:', topics.size);
const domainGroups = {};
for (const dt of [...topics].sort()) {
  const parts = dt.split('/').map(s => s.trim());
  const dom = parts[0];
  const top = parts[1] || '';
  if (!domainGroups[dom]) domainGroups[dom] = [];
  domainGroups[dom].push(top);
}

for (const [dom, subList] of Object.entries(domainGroups)) {
  console.log(`\nDomain: "${dom}" (${subList.length} subtopics)`);
  for (const s of subList) {
    console.log(`  - "${s}"`);
  }
}
