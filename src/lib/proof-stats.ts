/**
 * Single source of truth for the Statewave credibility figures surfaced
 * across the marketing site. Mirrored on the homepage (hero credibility
 * row, prerendered into dist/index.html, and the below-the-fold
 * ProofSection) and on the /about page. Recompute together when the
 * eval suite or the benchmark run changes — drift between surfaces makes
 * us look sloppy. The retrieval scores come from mem0's own harness and
 * must stay in sync with SYSTEMS in BenchmarksPage.tsx; the self-scored
 * support-workflow figure is deliberately not surfaced here.
 */
export const PROOF_STATS = [
  { value: '708', label: 'Unit tests' },
  { value: '56', label: 'Eval assertions' },
  { value: '0.905', label: "LoCoMo · mem0's harness" },
  { value: '0.967', label: "LongMemEval · mem0's harness" },
] as const
