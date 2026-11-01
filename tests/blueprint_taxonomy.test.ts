import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildTaxonomyIndex } from '../src/domain/taxonomy.ts';

describe('Official CCNA Exam v1.1 Blueprint Domain & Topic Matching', () => {
  const seedPath = path.join(process.cwd(), 'data', 'questions.seed.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const tags = seed.tags;
  const index = buildTaxonomyIndex(tags);

  it('contains exactly 6 official CCNA blueprint domains', () => {
    const domains = index.byKind.domain;
    assert.equal(domains.length, 6);
    const domainIds = domains.map(d => d.id);
    assert.deepEqual(domainIds, [
      'tag-domain-1',
      'tag-domain-2',
      'tag-domain-3',
      'tag-domain-4',
      'tag-domain-5',
      'tag-domain-6',
    ]);
  });

  it('strictly maps only Domain 1 topics (1.1 to 1.13) when Domain 1 is selected', () => {
    const domain1Topics = (index.childrenMap.get('tag-domain-1') || []).filter(t => t.kind === 'topic');
    assert.equal(domain1Topics.length, 13, 'Domain 1 must contain exactly 13 topics (1.1 - 1.13)');

    const expectedTopicIds = [
      'tag-topic-1-1', 'tag-topic-1-2', 'tag-topic-1-3', 'tag-topic-1-4',
      'tag-topic-1-5', 'tag-topic-1-6', 'tag-topic-1-7', 'tag-topic-1-8',
      'tag-topic-1-9', 'tag-topic-1-10', 'tag-topic-1-11', 'tag-topic-1-12',
      'tag-topic-1-13',
    ];
    assert.deepEqual(domain1Topics.map(t => t.id), expectedTopicIds);

    // Ensure NO topics from other domains exist under Domain 1
    for (const t of domain1Topics) {
      assert.match(t.id, /^tag-topic-1-/, `Topic ${t.id} must belong to Domain 1`);
      assert.equal(t.parentId, 'tag-domain-1');
      assert.doesNotMatch(t.id, /^tag-topic-[2-6]-/, `Domain 1 must not contain topics from other domains`);
    }
  });

  it('strictly maps only Domain 2 topics (2.1 to 2.9) when Domain 2 is selected', () => {
    const domain2Topics = (index.childrenMap.get('tag-domain-2') || []).filter(t => t.kind === 'topic');
    assert.equal(domain2Topics.length, 9, 'Domain 2 must contain exactly 9 topics (2.1 - 2.9)');

    for (const t of domain2Topics) {
      assert.match(t.id, /^tag-topic-2-/, `Topic ${t.id} must belong to Domain 2`);
      assert.equal(t.parentId, 'tag-domain-2');
    }
  });

  it('strictly maps only Domain 3 topics (3.1 to 3.5) when Domain 3 is selected', () => {
    const domain3Topics = (index.childrenMap.get('tag-domain-3') || []).filter(t => t.kind === 'topic');
    assert.equal(domain3Topics.length, 5, 'Domain 3 must contain exactly 5 topics (3.1 - 3.5)');

    for (const t of domain3Topics) {
      assert.match(t.id, /^tag-topic-3-/, `Topic ${t.id} must belong to Domain 3`);
      assert.equal(t.parentId, 'tag-domain-3');
    }
  });

  it('strictly maps only Domain 4 topics (4.1 to 4.9) when Domain 4 is selected', () => {
    const domain4Topics = (index.childrenMap.get('tag-domain-4') || []).filter(t => t.kind === 'topic');
    assert.equal(domain4Topics.length, 9, 'Domain 4 must contain exactly 9 topics (4.1 - 4.9)');

    for (const t of domain4Topics) {
      assert.match(t.id, /^tag-topic-4-/, `Topic ${t.id} must belong to Domain 4`);
      assert.equal(t.parentId, 'tag-domain-4');
    }
  });

  it('strictly maps only Domain 5 topics (5.1 to 5.10) when Domain 5 is selected', () => {
    const domain5Topics = (index.childrenMap.get('tag-domain-5') || []).filter(t => t.kind === 'topic');
    assert.equal(domain5Topics.length, 10, 'Domain 5 must contain exactly 10 topics (5.1 - 5.10)');

    for (const t of domain5Topics) {
      assert.match(t.id, /^tag-topic-5-/, `Topic ${t.id} must belong to Domain 5`);
      assert.equal(t.parentId, 'tag-domain-5');
    }
  });

  it('strictly maps only Domain 6 topics (6.1 to 6.7) when Domain 6 is selected', () => {
    const domain6Topics = (index.childrenMap.get('tag-domain-6') || []).filter(t => t.kind === 'topic');
    assert.equal(domain6Topics.length, 7, 'Domain 6 must contain exactly 7 topics (6.1 - 6.7)');

    for (const t of domain6Topics) {
      assert.match(t.id, /^tag-topic-6-/, `Topic ${t.id} must belong to Domain 6`);
      assert.equal(t.parentId, 'tag-domain-6');
    }
  });

  it('strictly maps subtopics to their parent topics', () => {
    const subtopics11 = (index.childrenMap.get('tag-topic-1-1') || []).filter(t => t.kind === 'subtopic');
    assert.equal(subtopics11.length, 8, 'Topic 1.1 must have 8 subtopics (1.1.a - 1.1.h)');
    const ids11 = subtopics11.map(s => s.id);
    assert.deepEqual(ids11, [
      'tag-subtopic-1-1-a', 'tag-subtopic-1-1-b', 'tag-subtopic-1-1-c', 'tag-subtopic-1-1-d',
      'tag-subtopic-1-1-e', 'tag-subtopic-1-1-f', 'tag-subtopic-1-1-g', 'tag-subtopic-1-1-h',
    ]);
  });
});
