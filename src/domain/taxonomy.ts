/**
 * CCNA Revise - Taxonomy & Scope Resolution
 * Pure, deterministic functions for hierarchy traversal, descendant resolution,
 * deduplication, and readable scope summaries.
 */

import type { Tag, Question, ScopeFilterSnapshot } from './types.ts';

export interface TaxonomyIndex {
  tagMap: Map<string, Tag>;
  childrenMap: Map<string, Tag[]>;
  byKind: Record<Tag['kind'], Tag[]>;
}

export function buildTaxonomyIndex(tags: Tag[]): TaxonomyIndex {
  const tagMap = new Map<string, Tag>();
  const childrenMap = new Map<string, Tag[]>();
  const byKind: Record<Tag['kind'], Tag[]> = {
    course: [],
    domain: [],
    topic: [],
    subtopic: [],
    module: [],
    lesson: [],
  };

  for (const tag of tags) {
    tagMap.set(tag.id, tag);
    if (byKind[tag.kind]) {
      byKind[tag.kind].push(tag);
    }

    if (tag.parentId) {
      if (!childrenMap.has(tag.parentId)) {
        childrenMap.set(tag.parentId, []);
      }
      childrenMap.get(tag.parentId)!.push(tag);
    }
  }

  return { tagMap, childrenMap, byKind };
}

/**
 * Returns all descendant tag IDs for a given parent tag ID (recursive).
 * Includes the parentTagId itself in the returned list.
 */
export function getDescendantTagIds(parentTagId: string, tags: Tag[]): string[] {
  const index = buildTaxonomyIndex(tags);
  const result = new Set<string>();

  function collect(id: string) {
    result.add(id);
    const children = index.childrenMap.get(id) || [];
    for (const child of children) {
      if (!result.has(child.id)) {
        collect(child.id);
      }
    }
  }

  collect(parentTagId);
  return Array.from(result);
}

/**
 * Resolves all eligible tag IDs for a given scope filter snapshot.
 * Combining sibling selections as a union, and including all descendant tags.
 */
export function resolveScopeTagIds(
  scope: Partial<ScopeFilterSnapshot>,
  tags: Tag[]
): string[] {
  const scopeType = scope.scopeType || 'all';
  if (scopeType === 'all') {
    return tags.map(t => t.id);
  }

  const tagSet = new Set<string>();

  if (scopeType === 'domain') {
    const domainIds = scope.domainTagIds || [];
    for (const domId of domainIds) {
      const descendants = getDescendantTagIds(domId, tags);
      for (const d of descendants) tagSet.add(d);
    }
  } else if (scopeType === 'topic') {
    const subtopicIds = scope.subtopicTagIds || [];
    const topicIds = scope.topicTagIds || [];

    if (subtopicIds.length > 0) {
      // Specific subtopics selected
      for (const subId of subtopicIds) {
        tagSet.add(subId);
      }
    } else if (topicIds.length > 0) {
      // Entire topics selected -> include all subtopics
      for (const topId of topicIds) {
        const descendants = getDescendantTagIds(topId, tags);
        for (const d of descendants) tagSet.add(d);
      }
    } else if (scope.domainTagIds?.length) {
      // Fallback to domain descendants if no topic selected
      for (const domId of scope.domainTagIds) {
        const descendants = getDescendantTagIds(domId, tags);
        for (const d of descendants) tagSet.add(d);
      }
    }
  } else if (scopeType === 'module') {
    const lessonIds = scope.lessonTagIds || [];
    const moduleIds = scope.moduleTagIds || [];

    if (lessonIds.length > 0) {
      for (const lId of lessonIds) tagSet.add(lId);
    } else if (moduleIds.length > 0) {
      for (const modId of moduleIds) {
        const descendants = getDescendantTagIds(modId, tags);
        for (const d of descendants) tagSet.add(d);
      }
    }
  }

  return Array.from(tagSet);
}

/**
 * Filters and deduplicates questions matching the given scope.
 * Sibling selections are combined as a union.
 * Questions matching multiple tags are included exactly once (deduplicated by question.id).
 */
export function filterQuestionsByScope(
  questions: Question[],
  scope: Partial<ScopeFilterSnapshot>,
  tags: Tag[]
): Question[] {
  const scopeType = scope.scopeType || 'all';
  if (scopeType === 'all') {
    return questions;
  }

  const resolvedTagIds = new Set(resolveScopeTagIds(scope, tags));
  if (resolvedTagIds.size === 0) {
    return [];
  }

  const matched = new Map<string, Question>();

  for (const q of questions) {
    // Check if question has any tag that intersects with resolvedTagIds
    const hasMatchingTag = q.tagIds.some(tId => resolvedTagIds.has(tId));
    if (hasMatchingTag) {
      matched.set(q.id, q);
    }
  }

  return Array.from(matched.values());
}

/**
 * Formats a clean, readable summary string for the active scope.
 */
export function formatScopeSummary(
  scope: Partial<ScopeFilterSnapshot>,
  tags: Tag[]
): string {
  const scopeType = scope.scopeType || 'all';
  if (scopeType === 'all') {
    return 'All Available Content';
  }

  const index = buildTaxonomyIndex(tags);

  if (scopeType === 'domain') {
    const domainIds = scope.domainTagIds || [];
    if (domainIds.length === 0) return 'All Domains';
    const names = domainIds
      .map(id => index.tagMap.get(id)?.name || id)
      .join(', ');
    return `Exam Domain: ${names}`;
  }

  if (scopeType === 'topic') {
    const domainName = scope.domainTagIds?.[0]
      ? index.tagMap.get(scope.domainTagIds[0])?.name
      : undefined;

    const topicNames = (scope.topicTagIds || [])
      .map(id => index.tagMap.get(id)?.name || id);

    const subtopicNames = (scope.subtopicTagIds || [])
      .map(id => index.tagMap.get(id)?.name || id);

    if (subtopicNames.length > 0) {
      const topName = topicNames[0] || 'Topic';
      return `${domainName ? `${domainName} → ` : ''}${topName} → ${subtopicNames.join(', ')}`;
    }

    if (topicNames.length > 0) {
      return `${domainName ? `${domainName} → ` : ''}${topicNames.join(', ')}`;
    }

    return domainName ? `Domain: ${domainName}` : 'All Topics';
  }

  if (scopeType === 'module') {
    const moduleNames = (scope.moduleTagIds || [])
      .map(id => index.tagMap.get(id)?.name || id);

    const lessonNames = (scope.lessonTagIds || [])
      .map(id => index.tagMap.get(id)?.name || id);

    if (lessonNames.length > 0) {
      return `Module: ${moduleNames.join(', ')} → Lesson: ${lessonNames.join(', ')}`;
    }

    if (moduleNames.length > 0) {
      return `Course Module: ${moduleNames.join(', ')}`;
    }

    return 'Course Modules (None Assigned)';
  }

  return 'Custom Scope';
}
