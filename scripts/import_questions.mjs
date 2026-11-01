import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const ingestionPath = path.join(projectRoot, 'ingestion', 'questions.json');
const seedPath = path.join(projectRoot, 'data', 'questions.seed.json');
const userDataPath = path.join(projectRoot, 'data', 'user-data.json');
const backupsDir = path.join(projectRoot, 'data', 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// 1. Back up existing files
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
if (fs.existsSync(seedPath)) {
  fs.copyFileSync(seedPath, path.join(backupsDir, `questions.seed.backup-${timestamp}.json`));
  console.log('Backed up questions.seed.json');
}
if (fs.existsSync(userDataPath)) {
  fs.copyFileSync(userDataPath, path.join(backupsDir, `user-data.backup-${timestamp}.json`));
  console.log('Backed up user-data.json');
}

// 2. Read ingestion package
const pkg = JSON.parse(fs.readFileSync(ingestionPath, 'utf8'));
console.log(`Ingesting package schema ${pkg.schemaVersion}, bank: ${pkg.bank.id}, questions: ${pkg.questions.length}`);

// Read existing seed for dev fixtures & domain tag preservation
const oldSeed = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : { questions: [], tags: [] };
const devFixtures = oldSeed.questions.filter(q => q.isDevFixture === true);
const oldDomainTags = (oldSeed.tags || []).filter(t => t.kind === 'domain' || t.kind === 'subtopic' || (t.kind === 'topic' && t.id.startsWith('tag-')));

// Map new taxonomy from package to Tag objects
const newTags = pkg.taxonomy.map(item => ({
  id: item.id,
  kind: item.kind,
  name: item.name,
  parentId: item.parentId || null,
  mappingStatus: item.mappingStatus,
}));

// Combine tags uniquely
const tagMap = new Map();
for (const t of oldDomainTags) {
  tagMap.set(t.id, t);
}
for (const t of newTags) {
  tagMap.set(t.id, t);
}
const combinedTags = Array.from(tagMap.values());

// Domain tag inference for questions based on module/topic
function inferDomainTags(q) {
  const result = [];
  const text = (q.prompt + ' ' + (q.blocks?.map(b => b.text || '').join(' ') || '')).toLowerCase();
  
  if (q.moduleIds?.includes('itn-v7-m01')) {
    result.push('tag-domain-1');
  } else if (q.moduleIds?.includes('itn-v7-m02')) {
    result.push('tag-domain-2');
  } else if (q.moduleIds?.includes('itn-v7-m03')) {
    result.push('tag-domain-3');
  }

  if (/security|threat|spyware|password|firewall|antivirus|dos attack/i.test(text)) {
    result.push('tag-domain-5', 'tag-topic-security-basics');
  }
  if (/switch|vlan|svi|console|terminal|exec|command/i.test(text)) {
    result.push('tag-domain-2', 'tag-topic-switch-config');
  }
  if (/router|route|routing|hop|packet forwarding/i.test(text)) {
    result.push('tag-domain-3', 'tag-topic-routing-forwarding');
  }
  if (/osi|tcp|udp|encapsulation|pdu|layer|protocol/i.test(text)) {
    result.push('tag-domain-1', 'tag-topic-osi-tcp');
  }
  if (/fiber|copper|cable|light|outlet|powerline/i.test(text)) {
    result.push('tag-domain-1', 'tag-topic-media-cabling');
  }
  if (/soho|cloud|intranet|extranet|byod|isp|internet/i.test(text)) {
    result.push('tag-domain-1', 'tag-topic-network-architectures');
  }

  return [...new Set(result)];
}

// 3. Transform and reconcile questions
const assetMap = new Map();
assetMap.set('q018-exhibit', {
  id: 'q018-exhibit',
  type: 'image',
  url: '/exhibits/q018-exhibit.jpeg',
  caption: 'SW1 Access Control Configuration',
  altText: 'SW1 configuration: enable password letmein; enable secret secretin; console password lineconin with login; VTY password linevtyin with login.'
});
assetMap.set('q043-exhibit', {
  id: 'q043-exhibit',
  type: 'image',
  url: '/exhibits/q043-exhibit.png',
  caption: 'HostA to ServerB Network Topology',
  altText: 'HostA connects through SwitchA to RouterA. RouterA connects to RouterB. RouterB connects through SwitchB to ServerB.'
});
assetMap.set('q054-exhibit', {
  id: 'q054-exhibit',
  type: 'image',
  url: '/exhibits/q054-exhibit.png',
  caption: 'Switch1 Command Line Error',
  altText: 'Switch1> config t produces an invalid-input marker. The prompt ends with >.'
});

const importedQuestions = [];

for (const q of pkg.questions) {
  // Determine primary source number
  const primarySourceNum = q.sourceNumbers?.[0]?.number || 0;
  
  // Reconcile ID:
  // Q1..51 -> ccna-q001 .. ccna-q051
  // Q53..75 -> ccna-q053 .. ccna-q075
  // itn-m01-03-answer-q069 -> ccna-answer-q069
  // itn-m01-03-answer-q076 -> ccna-q076
  let internalId = `ccna-${q.externalId.replace('itn-m01-03-', '')}`;
  if (q.externalId === 'itn-m01-03-test-q069') {
    internalId = 'ccna-q069';
  } else if (q.externalId === 'itn-m01-03-answer-q069') {
    internalId = 'ccna-answer-q069';
  } else if (q.externalId === 'itn-m01-03-answer-q076') {
    internalId = 'ccna-q076';
  } else if (primarySourceNum > 0 && primarySourceNum !== 52) {
    internalId = `ccna-q${String(primarySourceNum).padStart(3, '0')}`;
  }

  // Build tagIds
  const domainTags = inferDomainTags(q);
  const tagIds = [
    'ccna1-itn-v7',
    ...(q.moduleIds || []),
    ...(q.topicIds || []),
    ...domainTags
  ];
  const uniqueTagIds = [...new Set(tagIds)];

  // Assets
  const assetReferences = [];
  if (q.blocks) {
    for (const b of q.blocks) {
      if (b.type === 'image' && b.assetId && assetMap.has(b.assetId)) {
        assetReferences.push(assetMap.get(b.assetId));
      }
    }
  }

  // Structured Blocks (code / preformatted)
  const structuredBlocks = [];
  if (q.blocks) {
    for (const b of q.blocks) {
      if (b.type === 'code') {
        structuredBlocks.push({
          type: 'code',
          content: b.text,
          text: b.text,
          language: b.language,
        });
      } else if (b.type === 'text') {
        structuredBlocks.push({
          type: 'paragraph',
          content: b.text,
          text: b.text,
        });
      }
    }
  }

  // Payload normalization
  let payload;
  if (q.type === 'single') {
    payload = {
      options: q.payload.options,
      correctOptionIds: q.payload.correctOptionIds,
      requiredSelections: 1,
    };
  } else if (q.type === 'multi') {
    payload = {
      options: q.payload.options,
      correctOptionIds: q.payload.correctOptionIds,
      requiredSelections: q.payload.requiredSelections,
    };
  } else if (q.type === 'matching') {
    const correctMapping = Object.fromEntries(
      q.payload.correctMatches.map(m => [m.promptId, m.choiceId])
    );
    payload = {
      prompts: q.payload.prompts,
      choices: q.payload.choices,
      correctMatches: q.payload.correctMatches,
      correctMapping,
      allowChoiceReuse: q.payload.allowChoiceReuse,
      allowNoMatch: q.payload.allowNoMatch ?? false,
    };
  } else if (q.type === 'ordering') {
    payload = {
      items: q.payload.items,
      correctOrderIds: q.payload.correctOrderIds,
      distractorItemIds: q.payload.distractorItemIds || [],
    };
  }

  // Explanations & rationales
  const incorrectRationales = [];
  if (q.type === 'single' || q.type === 'multi') {
    const correctSet = new Set(q.payload.correctOptionIds);
    for (const r of q.explanation.optionRationales || []) {
      if (!correctSet.has(r.optionId)) {
        incorrectRationales.push({
          optionIdOrKey: r.optionId,
          reason: r.rationale.text,
        });
      }
    }
  } else if (q.type === 'matching') {
    for (const r of q.explanation.matchingRationales || []) {
      incorrectRationales.push({
        optionIdOrKey: r.promptId,
        reason: r.rationale.text,
      });
    }
  } else if (q.type === 'ordering') {
    for (const r of q.explanation.orderingRationales || []) {
      incorrectRationales.push({
        optionIdOrKey: r.itemId,
        reason: r.rationale.text,
      });
    }
  }

  const references = (q.provenance?.sourceRefs || []).map(r => `${r.sourceId}${r.locator ? ` - ${r.locator}` : ''}`);

  const cleanupNotes = q.editorialNotes?.map(e => `${e.field}: ${e.reason}`).join('; ') || undefined;

  const questionRecord = {
    id: internalId,
    bankId: pkg.bank.id,
    externalId: q.externalId,
    sourceNumber: primarySourceNum,
    version: q.revision || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: q.type,
    status: 'verified', // All 76 are verified & available for Learn and Assessment
    prompt: q.prompt,
    structuredBlocks: structuredBlocks.length > 0 ? structuredBlocks : undefined,
    blocks: q.blocks,
    sourceNumbers: q.sourceNumbers,
    moduleIds: q.moduleIds,
    topicIds: q.topicIds,
    payload,
    explanation: {
      answerReasoning: q.explanation.summary?.text || q.explanation.sourceExplanation?.text || 'Correct answer according to official curriculum.',
      conceptRefresher: q.explanation.concept?.text || '',
      incorrectRationales: incorrectRationales.length > 0 ? incorrectRationales : undefined,
      practicalExampleOrCommands: q.explanation.practicalExample
        ? `${q.explanation.practicalExample.intro.text}\n\n${q.explanation.practicalExample.code || ''}`.trim()
        : undefined,
      commonMisconception: q.explanation.commonMistakes?.[0]?.text || undefined,
      references,
      summary: q.explanation.summary,
      concept: q.explanation.concept,
      sourceExplanation: q.explanation.sourceExplanation,
      optionRationales: q.explanation.optionRationales,
      matchingRationales: q.explanation.matchingRationales,
      orderingRationales: q.explanation.orderingRationales,
      commonMistakes: q.explanation.commonMistakes,
      practicalExample: q.explanation.practicalExample,
      relatedQuestionIds: q.explanation.relatedQuestionIds,
    },
    assetReferences,
    tagIds: uniqueTagIds,
    cleanupNotes,
    duplicateGroupId: q.duplicateGroupId || null,
    verificationRecord: {
      verified: true,
      verifiedAt: '2026-11-01',
      whatWasChecked: 'Reconciled from official CCNA 1 v7 modules 1-3 exam answers and question paper',
      consultedSources: (q.provenance?.sourceRefs || []).map(r => r.sourceId),
      suggestedReferences: references,
    },
    provenance: q.provenance,
    editorialNotes: q.editorialNotes,
  };

  importedQuestions.push(questionRecord);
}

// Ensure Q52 is strictly excluded
const filteredFinal = importedQuestions.filter(q => q.sourceNumber !== 52 && q.externalId !== 'itn-m01-03-test-q052' && q.id !== 'ccna-q052');
console.log(`Final imported active questions count: ${filteredFinal.length}`);

// Combine with dev fixtures for test isolation
const allSeedQuestions = [...filteredFinal, ...devFixtures];

const newSeed = {
  schemaVersion: 1,
  bankId: pkg.bank.id,
  bankName: pkg.bank.title,
  tags: combinedTags,
  questions: allSeedQuestions,
};

// Write atomic update
const tempSeed = path.join(projectRoot, 'data', `questions.seed.tmp.${Date.now()}.json`);
fs.writeFileSync(tempSeed, JSON.stringify(newSeed, null, 2), 'utf8');
try {
  fs.renameSync(tempSeed, seedPath);
} catch {
  fs.copyFileSync(tempSeed, seedPath);
  fs.unlinkSync(tempSeed);
}
console.log('Successfully written new questions.seed.json!');

// Clean Q52 from user-data.json questions array if present
if (fs.existsSync(userDataPath)) {
  const ud = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  let modified = false;
  if (Array.isArray(ud.questions)) {
    const beforeCount = ud.questions.length;
    ud.questions = ud.questions.filter(q => q.id !== 'ccna-q052' && q.sourceNumber !== 52 && q.externalId !== 'itn-m01-03-test-q052');
    if (ud.questions.length !== beforeCount) {
      modified = true;
      console.log(`Removed Q52 from user-data.json questions array`);
    }
  }
  if (modified) {
    fs.writeFileSync(userDataPath, JSON.stringify(ud, null, 2), 'utf8');
  }
}

console.log('Import migration completed successfully.');
