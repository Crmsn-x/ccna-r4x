# CCNA question import contract 1.1.0

This contract supersedes v1.0.0 for this package. The change removes status/review/reviewState fields and all review-based eligibility gates. Every included question is importable and usable in normal Learn and Assessment. Packet Tracer activity questions are excluded from this batch.

## Root

Required keys: schemaVersion ("1.1.0"), bank, sources, taxonomy, assets, questions.

bank: id, title, courseId, moduleIds, language. Identity is bank.id + question.externalId; map to existing internal IDs without resetting history.

sources: id, title, kind, fileName, url, sha256. For supplied files the digest is real; remote references may have null fileName/sha256. kind is question-paper, answer-key, official-reference or other.

Evidence references: sourceId, pages (physical 1-based PDF pages; empty for non-PDF evidence), locator.

Taxonomy: id, kind, name, parentId, mappingStatus. Kinds: course/module/lesson/domain/topic/subtopic. Parent references must exist and be acyclic. mappingStatus identifies source-confirmed versus proposed editorial groupings, not a question eligibility state.

Assets: id, path, mimeType, sha256, alt, role, sourceRefs, containsAnswer. Paths must be relative, confined to assets/, present and digest-valid. role: question-exhibit/explanation-figure/lab-file. This batch has only question-exhibit assets, with containsAnswer false. Do not infer that all images are Packet Tracer labs.

## Question

Required: externalId, revision, sourceNumbers, type, prompt, blocks, moduleIds, topicIds, payload, explanation, provenance, duplicateGroupId.

sourceNumbers: sourceId, number, pages. Preserve differing numbers and source variants. revision is a positive integer. type is single/multi/matching/ordering. blocks contain type text/code/image plus text, optional language or assetId as appropriate.

provenance: sourceRefs and answerOrigin (source-key/author-proposed/reconciled). This tracks where content came from; it does not restrict availability. Optional editorialNotes record field, originalText, revisedText and reason for a correction or equivalent interaction transformation.

No status, review or reviewState fields are required or supplied. Do not manufacture draft or unverified tags. An existing internal status field may be mapped to the app's normal active/published state without claiming a technical audit occurred.

## Answer payloads

single/multi: options [{id,text}], correctOptionIds, requiredSelections. Exactly one answer for single. Multiple unique existing answer IDs for multi; requiredSelections must match the key length. Mark multi by exact unordered set.

matching: prompts [{id,text}], choices [{id,text}], correctMatches [{promptId,choiceId}], allowChoiceReuse, allowNoMatch. Every prompt has one mapping. choiceId may be null only if allowNoMatch; provide a Not used control. Repeated non-null choices require allowChoiceReuse. Unused distractor choices are allowed.

ordering: items [{id,text}], correctOrderIds, distractorItemIds. The order and distractors must uniquely partition all items. Expose a Not used area if distractors exist. Mark both sequence and exclusions. Persist shuffled display order separately from the key.

## Explanations

Each teaching paragraph uses {text, origin, sourceRefs}. origin: source-verbatim/source-paraphrase/assistant-authored/user-authored. There is no reviewState or feedback restriction based on authorship.

explanation contains summary, concept, optionRationales, matchingRationales, orderingRationales, commonMistakes, practicalExample, sourceExplanation, relatedQuestionIds.

- optionRationales: one {optionId,rationale} for every option, including all incorrect choices.
- matchingRationales: one {promptId,rationale} for each prompt.
- orderingRationales: one {itemId,rationale} for every item, including distractors.
- commonMistakes: list of teaching paragraphs.
- practicalExample: null or {intro: teaching paragraph, code: string|null, language: string|null}.
- sourceExplanation: separately retained source paragraph, or null when absent. Source tables represented in the answer payload are not invented prose explanations.
- relatedQuestionIds: valid stable external IDs.

Correctness comes from the answer payload, not duplicated flags in the rationales. Use authored summaries/concept notes to explain nuances and retain the supplied explanation separately.

## Runtime and import rules

Validate shapes, enums, unique IDs, references, complete rationale coverage and asset integrity before commit. Validation failure means malformed data, not an editorial draft state. Preview import changes and preserve existing progress, with recoverable records/assets commits.

All included questions can appear in normal Learn and Assessment. Learn reveals feedback after explicit submission; Assessment after finalisation. Mark server-side against the pinned question version. Never send answer keys, rationales or answer-bearing assets in pre-feedback responses.

Bookmarked/browsed records are not attempts. Save sessions and idempotency tokens so retries, navigation and refresh do not duplicate scoring. Apply normal progress and review scheduling to submitted attempts.

Removed record: itn-m01-03-test-q052 (Packet Tracer activity). If previously imported, exclude/remove it from the active bank and future sessions while preserving historical attempt snapshots. Do not import a replacement placeholder.
