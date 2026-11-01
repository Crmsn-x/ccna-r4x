# Import the Modules 1–3 question bank

Updated 1 November 2026 following the user's correction. This package supersedes the previous draft/review workflow. Keep the finished Next.js UI unchanged.

## Agent instructions

1. Import questions.json and assets/ into the existing bank using the included schema 1.1.0 contract. There are 76 questions. All are available for ordinary Learn and Assessment immediately after a successful import. Do not add draft, unverified, pending-review or verification badges, and do not introduce a review gate.
2. The Packet Tracer activity question (test Q52; externalId itn-m01-03-test-q052) has been removed entirely. Do not import it as a placeholder, blocked record or lab. Practical labs are outside this batch.
3. If the previous package has already been imported, remove that exact question from the active bank and all future practice pools, and clear its bank warning/count. Preserve any historical attempt snapshots rather than erasing history. Do not globally delete unrelated questions or labs. Remove the earlier review-based restrictions from the other records in this bank.
4. Preserve existing internal IDs and progress. Map bank.id + externalId to existing records. If older records have a different ID scheme, reconcile by prompt, options and source before creating duplicates. Preview changes, back up the store, then commit through the existing atomic store operations. Reimporting unchanged content is a no-op; changed content preserves prior attempt versions.
5. Keep answer keys and explanations server-side. Before submission return only the question and permitted exhibits. Learn mode reveals correctness and explanations immediately after Submit answer. Assessment reveals them after finalisation. Do not expose hidden answers in client bundles or public JSON.
6. Use the approved question and explanation panels. Show the direct answer and reasoning, then the concept notes and why each option is correct or incorrect. Preserve supplied explanations separately; authored supplementary explanations are stored with provenance but need no draft badge or blocking notice.
7. Support single-choice, multiple-choice, matching and ordering. Exact-set grading for multiple-choice. Respect repeated matching categories and Not used when specified. Q24 includes an unused ordering item; Q27 includes reused mode categories and one Not used statement. Do not shuffle on refresh or reveal the answer through initial ordering.
8. Filter by module/topic/section using the supplied taxonomy. Source numeric topics and proposed human-readable section groupings are distinct metadata. Duplicate variants remain available; choose at most one per duplicateGroupId in a practice session by default.
9. Persist session selection, ordering, position, responses and results. Resume must restore them. Make submission and finalisation idempotent. Browsing or bookmarking must not record an attempt. Normal Learn and Assessment attempts participate in the app's normal progress and review rules.
10. Verify the resulting counts, all question types, all three exhibits, refresh/resume, explanation timing and reimport behaviour. Report actual results. Do not redesign the UI or replace the application.

## Contents

- questions.json: 76 questions, keys and explanations.
- assets/: three source exhibits; these are ordinary question diagrams, not Packet Tracer activities.
- IMPORT-CONTRACT.md: current schema and marking rules.
- IMPORT-REPORT.md: source reconciliation and changes.
- source-crosswalk.csv: question-to-source mapping.
- validate_package.py and validation-result.json: data integrity checks and result.

Run `python validate_package.py` (or `py validate_package.py` on Windows). This validates the package, not the app integration. No local application repository was supplied here, so the package has not been imported into the user's PC app.
