# CI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable GitHub Action for crap4ts, update the CI workflow to dogfood it, and change the default threshold from 12 to 16.

**Architecture:** Composite GitHub Action (shell steps, no JS bundling) at repo root. The action runs crap4ts via npx (or local build for dogfooding), posts PR comments via `gh api`, and uploads JSON artifacts. The CI workflow uses `uses: ./` to self-reference.

**Tech Stack:** GitHub Actions (composite), shell scripting, `jq`, `gh` CLI, crap4ts CLI

**Spec:** `docs/superpowers/specs/2026-03-22-ci-integration-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/domain/threshold.ts` | Modify | Change `PRESETS.default` from 12 → 16 |
| `src/cli/cli.ts` | Modify | Change init template threshold from 12 → 16 |
| `.claude/rules/domain.md` | Modify | Fix stale threshold docs (says 30, should say 16) |
| `action.yml` | Create | Reusable composite GitHub Action |
| `.github/workflows/ci.yml` | Modify | Dogfood the action, add PR comments, parallel mutation |
| Tests (see task 1 for list) | Modify | Update default threshold assertions from 12 → 16 |

---

### Task 1: Change Default Threshold from 12 → 16

**Files:**
- Modify: `src/domain/threshold.ts:7`
- Modify: `src/cli/cli.ts:100`
- Modify: `.claude/rules/domain.md:16`
- Modify: `tests/domain/threshold.test.ts:5-7`
- Modify: `tests/domain/crap.test.ts:71-76`
- Modify: `tests/domain/contributors.test.ts:24`
- Modify: `tests/domain/summary.test.ts:116`
- Modify: `tests/core/analyze.test.ts:153,173,280`
- Modify: `tests/core/analyze-file.test.ts:137`
- Modify: `tests/cli/config.test.ts:377-379,398`
- Modify: `tests/cli/config-file-defaults.test.ts:326`
- Modify: `tests/adapters/reporters/console.test.ts:83,256,277,307`
- Modify: `tests/adapters/reporters/json.test.ts:83,171,179`
- Modify: `tests/adapters/reporters/markdown.test.ts:95,139`
- Modify: `tests/adapters/reporters/contributor-rendering.test.ts:58`

- [ ] **Step 1: Update the source — `PRESETS.default`**

In `src/domain/threshold.ts`, change line 7:
```typescript
// Before:
  default: 12,
// After:
  default: 16,
```

- [ ] **Step 2: Update the source — init template**

In `src/cli/cli.ts`, change line 100:
```typescript
// Before:
  threshold: 12,
// After:
  threshold: 16,
```

- [ ] **Step 3: Update the domain rule file**

In `.claude/rules/domain.md`, change line 16:
```markdown
// Before:
7. **Threshold config** — `threshold.ts` supports glob-based per-path overrides. Default threshold is 30, `--strict` is 8.
// After:
7. **Threshold config** — `threshold.ts` supports glob-based per-path overrides. Default threshold is 16, `--strict` is 8, `--lenient` is 30.
```

- [ ] **Step 4: Update tests that assert the default threshold value**

These tests assert the *default* is 12 and must change to 16:

**`tests/domain/threshold.test.ts`** — The description and expected value:
```typescript
// Before:
  it("uses default threshold of 12 when no options", () => {
    ...
    expect(config.defaultThreshold).toBe(12);
// After:
  it("uses default threshold of 16 when no options", () => {
    ...
    expect(config.defaultThreshold).toBe(16);
```

**`tests/core/analyze.test.ts`** — Lines 153 and 173:
```typescript
// Before:
  it("applies default threshold of 12", async () => {
    ...
    expect(result.functions[0]!.threshold).toBe(12);
// After:
  it("applies default threshold of 16", async () => {
    ...
    expect(result.functions[0]!.threshold).toBe(16);
```

Line 280 — update the comment:
```typescript
// Before:
    // Default threshold 12 => exceeds
// After:
    // Default threshold 16 => exceeds
```

**`tests/core/analyze-file.test.ts`** — Line 137:
```typescript
// Before:
    expect(verdict.threshold).toBe(12); // default
// After:
    expect(verdict.threshold).toBe(16); // default
```

**`tests/cli/config.test.ts`** — Lines 377-379 and 398:
```typescript
// Before:
  it("uses default threshold of 12 when none specified", () => {
    ...
    expect(tc.defaultThreshold).toBe(12);
// After:
  it("uses default threshold of 16 when none specified", () => {
    ...
    expect(tc.defaultThreshold).toBe(16);
```
And at line 398:
```typescript
// Before:
    expect(tc.defaultThreshold).toBe(12);
// After:
    expect(tc.defaultThreshold).toBe(16);
```

**`tests/cli/config-file-defaults.test.ts`** — Line 326:
```typescript
// Before:
      expect(content).toMatch(/threshold:\s*12/);
// After:
      expect(content).toMatch(/threshold:\s*16/);
```

- [ ] **Step 5: Update test helper defaults and fixture thresholds**

These tests use `threshold = 12` as a helper default or fixture value. Update to 16 to stay consistent with the new default:

**`tests/adapters/reporters/console.test.ts`** — Line 83 (helper default), line 277, line 307:
```typescript
// Line 83 helper:
// Before:
  threshold = 12,
// After:
  threshold = 16,

// Line 277:
// Before:
      expect(output).toContain("default: 12");
// After:
      expect(output).toContain("default: 16");

// Line 307:
// Before:
      expect(output).toContain("above threshold (12)");
// After:
      expect(output).toContain("above threshold (16)");
```

**`tests/adapters/reporters/json.test.ts`** — Line 83 (helper default), lines 171, 179:
```typescript
// Line 83 helper:
// Before:
  threshold = 12,
// After:
  threshold = 16,

// Lines 171 and 179:
// Before:
          defaultThreshold: 12,
// After:
          defaultThreshold: 16,
```

**`tests/adapters/reporters/markdown.test.ts`** — Line 95 (helper default), line 139:
```typescript
// Line 95 helper:
// Before:
  threshold = 12,
// After:
  threshold = 16,

// Line 139:
// Before:
      expect(output).toContain("**Result: FAIL** | 3 of 47 functions above threshold (12)");
// After:
      expect(output).toContain("**Result: FAIL** | 3 of 47 functions above threshold (16)");
```

**`tests/adapters/reporters/contributor-rendering.test.ts`** — Line 58:
```typescript
// Before:
    thresholdConfig: { defaultThreshold: 12, overrides: [] },
// After:
    thresholdConfig: { defaultThreshold: 16, overrides: [] },
```

**`tests/domain/contributors.test.ts`** — Line 24:
```typescript
// Before:
    threshold: 12,
// After:
    threshold: 16,
```

**`tests/domain/summary.test.ts`** — Line 116:
```typescript
// Before:
      threshold: 12, exceeds: false,
// After:
      threshold: 16, exceeds: false,
```

- [ ] **Step 6: Decide which parametric tests to keep at 12**

The `tests/domain/crap.test.ts` lines 71-76 use explicit `threshold: 12` in parametric test data. These test the formula/exceeds semantics with specific threshold values, NOT the default. **Keep them at 12** — they're testing that the exceeds logic works correctly against any threshold value, not that the default is 12.

However, review each case: with default 16, some of these test scenarios would flip. But since they use explicit `threshold: 12` in each row (not the default), they don't need changing. Verify: `cc: 3, cov: 0` → CRAP = 30.0, threshold 12 → exceeds? The test says `false`... that's because CRAP(3, 0%) = 9×1+3 = 12.0 which equals 12 exactly, and exceeds means strictly greater than. This is correct. **No changes needed in this file.**

- [ ] **Step 7: Run all tests**

Run: `npm run test`
Expected: All tests pass with the new default of 16.

- [ ] **Step 8: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: Clean.

- [ ] **Step 9: Commit**

```bash
git add src/domain/threshold.ts src/cli/cli.ts .claude/rules/domain.md tests/
git commit -m "feat(domain): change default CRAP threshold from 12 to 16

The previous default of 12 was too close to the strict preset (8),
making it impractical as a general-purpose default. 16 provides better
spacing across the preset scale: strict(8) — default(16) — lenient(30).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create the Composite GitHub Action

**Files:**
- Create: `action.yml`

- [ ] **Step 1: Create `action.yml`**

```yaml
name: 'crap4ts'
description: 'CRAP score analysis for TypeScript — find complex, under-tested functions'
author: 'Breezy Bays Labs'

branding:
  icon: 'activity'
  color: 'orange'

inputs:
  threshold:
    description: 'CRAP score threshold (default: 30 for gradual adoption)'
    required: false
    default: ''
  coverage-path:
    description: 'Path to coverage JSON. Omit to let CLI auto-discover.'
    required: false
    default: ''
  src:
    description: 'Source directories (space-separated). Omit to let CLI auto-discover.'
    required: false
    default: ''
  changed-only:
    description: 'Only analyze functions changed in this PR'
    required: false
    default: 'true'
  post-comment:
    description: 'Post/update PR comment with results'
    required: false
    default: 'true'
  upload-artifact:
    description: 'Upload JSON report as workflow artifact'
    required: false
    default: 'true'
  version:
    description: 'crap4ts version to install via npx'
    required: false
    default: 'latest'
  working-directory:
    description: 'Directory to run analysis from'
    required: false
    default: '.'
  coverage-metric:
    description: 'Coverage metric: line or branch'
    required: false
    default: ''
  local:
    description: 'Use local dist/cli.js instead of npx (for dogfooding)'
    required: false
    default: 'false'

outputs:
  passed:
    description: 'Whether all functions passed threshold'
    value: ${{ steps.parse.outputs.passed }}
  total:
    description: 'Total functions analyzed'
    value: ${{ steps.parse.outputs.total }}
  exceeding:
    description: 'Count of functions exceeding threshold'
    value: ${{ steps.parse.outputs.exceeding }}
  exit-code:
    description: 'Raw exit code (0=pass, 1=threshold, 2=config, 3=parse)'
    value: ${{ steps.analyze.outputs.exit_code }}

runs:
  using: 'composite'
  steps:
    # Step 1: Run JSON analysis
    - name: Run CRAP analysis (JSON)
      id: analyze
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: |
        # Build the command
        if [ "${{ inputs.local }}" = "true" ]; then
          CMD="node dist/cli.js"
        else
          CMD="npx crap4ts@${{ inputs.version }}"
        fi

        CMD="$CMD --format json"

        # Conditionally add flags only when inputs are explicitly set
        if [ -n "${{ inputs.threshold }}" ]; then
          CMD="$CMD --threshold ${{ inputs.threshold }}"
        fi
        if [ -n "${{ inputs.coverage-path }}" ]; then
          CMD="$CMD --coverage ${{ inputs.coverage-path }}"
        fi
        if [ -n "${{ inputs.src }}" ]; then
          CMD="$CMD --src ${{ inputs.src }}"
        fi
        if [ -n "${{ inputs.coverage-metric }}" ]; then
          CMD="$CMD --coverage-metric ${{ inputs.coverage-metric }}"
        fi

        # Changed-only mode in PR context
        if [ "${{ inputs.changed-only }}" = "true" ] && [ -n "${{ github.event.pull_request.base.sha }}" ]; then
          CMD="$CMD --changed-since ${{ github.event.pull_request.base.sha }}"
        fi

        echo "Running: $CMD"

        # Capture exit code without failing the step
        set +e
        $CMD > crap4ts-report.json 2>&1
        EXIT_CODE=$?
        set -e

        echo "exit_code=$EXIT_CODE" >> "$GITHUB_OUTPUT"

        # For config/parse errors, dump the output and fail immediately
        if [ $EXIT_CODE -eq 2 ] || [ $EXIT_CODE -eq 3 ]; then
          echo "::error::crap4ts failed with exit code $EXIT_CODE"
          cat crap4ts-report.json
          exit $EXIT_CODE
        fi

    # Step 2: Parse JSON outputs
    - name: Parse analysis results
      id: parse
      if: steps.analyze.outputs.exit_code == '0' || steps.analyze.outputs.exit_code == '1'
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: |
        echo "passed=$(jq -r '.passed' crap4ts-report.json)" >> "$GITHUB_OUTPUT"
        echo "total=$(jq -r '.summary.totalFunctions' crap4ts-report.json)" >> "$GITHUB_OUTPUT"
        echo "exceeding=$(jq -r '.summary.exceedingThreshold' crap4ts-report.json)" >> "$GITHUB_OUTPUT"

    # Step 3: Run markdown analysis for PR comment
    - name: Run CRAP analysis (Markdown)
      id: markdown
      if: |
        inputs.post-comment == 'true' &&
        github.event_name == 'pull_request' &&
        (steps.analyze.outputs.exit_code == '0' || steps.analyze.outputs.exit_code == '1')
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: |
        # Build the command (same flags as JSON, different format)
        if [ "${{ inputs.local }}" = "true" ]; then
          CMD="node dist/cli.js"
        else
          CMD="npx crap4ts@${{ inputs.version }}"
        fi

        CMD="$CMD --format markdown"

        if [ -n "${{ inputs.threshold }}" ]; then
          CMD="$CMD --threshold ${{ inputs.threshold }}"
        fi
        if [ -n "${{ inputs.coverage-path }}" ]; then
          CMD="$CMD --coverage ${{ inputs.coverage-path }}"
        fi
        if [ -n "${{ inputs.src }}" ]; then
          CMD="$CMD --src ${{ inputs.src }}"
        fi
        if [ -n "${{ inputs.coverage-metric }}" ]; then
          CMD="$CMD --coverage-metric ${{ inputs.coverage-metric }}"
        fi

        if [ "${{ inputs.changed-only }}" = "true" ] && [ -n "${{ github.event.pull_request.base.sha }}" ]; then
          CMD="$CMD --changed-since ${{ github.event.pull_request.base.sha }}"
        fi

        # Run and capture (ignore exit code — we already have it from step 1)
        set +e
        $CMD > crap4ts-comment-body.md
        set -e

        # Build full comment with marker and footer
        THRESHOLD="${{ inputs.threshold }}"
        if [ -z "$THRESHOLD" ]; then
          THRESHOLD="default"
        fi

        if [ "${{ inputs.changed-only }}" = "true" ] && [ -n "${{ github.event.pull_request.base.sha }}" ]; then
          MODE="Changed functions only"
        else
          MODE="Full analysis"
        fi

        {
          echo "<!-- crap4ts-report -->"
          cat crap4ts-comment-body.md
          echo ""
          echo "---"
          echo "*Threshold: ${THRESHOLD} · ${MODE} · [Workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})*"
        } > crap4ts-comment.md

    # Step 4: Upsert PR comment
    - name: Post PR comment
      if: |
        inputs.post-comment == 'true' &&
        github.event_name == 'pull_request' &&
        (steps.analyze.outputs.exit_code == '0' || steps.analyze.outputs.exit_code == '1')
      shell: bash
      env:
        GH_TOKEN: ${{ github.token }}
      run: |
        PR_NUMBER=${{ github.event.pull_request.number }}
        REPO=${{ github.repository }}
        MARKER="<!-- crap4ts-report -->"
        COMMENT_BODY=$(cat "${{ inputs.working-directory }}/crap4ts-comment.md")

        # Find existing comment with marker
        COMMENT_ID=$(gh api \
          "repos/${REPO}/issues/${PR_NUMBER}/comments" \
          --paginate \
          --jq ".[] | select(.body | contains(\"${MARKER}\")) | .id" \
          | head -1)

        if [ -n "$COMMENT_ID" ]; then
          # Update existing comment
          gh api \
            "repos/${REPO}/issues/comments/${COMMENT_ID}" \
            --method PATCH \
            --field body="$COMMENT_BODY"
          echo "Updated existing comment $COMMENT_ID"
        else
          # Create new comment
          gh api \
            "repos/${REPO}/issues/${PR_NUMBER}/comments" \
            --method POST \
            --field body="$COMMENT_BODY"
          echo "Created new comment"
        fi

    # Step 5: Upload artifact
    - name: Upload CRAP report
      if: inputs.upload-artifact == 'true' && (steps.analyze.outputs.exit_code == '0' || steps.analyze.outputs.exit_code == '1')
      uses: actions/upload-artifact@v4
      with:
        name: crap4ts-report
        path: ${{ inputs.working-directory }}/crap4ts-report.json
        retention-days: 30

    # Step 6: Fail if threshold exceeded
    - name: Check threshold result
      if: steps.analyze.outputs.exit_code == '1'
      shell: bash
      run: |
        echo "::error::CRAP analysis found ${{ steps.parse.outputs.exceeding }} function(s) exceeding threshold"
        exit 1
```

- [ ] **Step 2: Verify action.yml is valid YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('action.yml'))" && echo "Valid YAML"`
Expected: `Valid YAML`

- [ ] **Step 3: Commit**

```bash
git add action.yml
git commit -m "feat(ci): add reusable GitHub Action for CRAP analysis

Composite action that runs crap4ts, posts PR comments (upserted),
uploads JSON artifacts, and fails on threshold violations. Supports
changed-only mode, configurable thresholds, and local dogfooding.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Update CI Workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Update `ci.yml`**

Replace the entire file with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  crap-analysis:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - name: CRAP Analysis (dogfooding)
        uses: ./
        with:
          local: true
          changed-only: ${{ github.event_name == 'pull_request' }}
          post-comment: ${{ github.event_name == 'pull_request' }}
          upload-artifact: true

  mutation:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run mutation
```

- [ ] **Step 2: Review changes vs original**

Key differences from the original `ci.yml`:
1. Added `permissions: pull-requests: write` at workflow level
2. Replaced `coverage` job with `crap-analysis` job
3. `crap-analysis` uses `fetch-depth: 0` for git diff support
4. `crap-analysis` dogfoods via `uses: ./` with `local: true`
5. No explicit `threshold` — uses CLI default (16) or config file
6. `mutation` depends on `check` (not `crap-analysis`) — runs in parallel

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: dogfood crap4ts action with PR comments and artifacts

Replace inline coverage/crap step with the new reusable action.
Mutation testing now runs parallel to CRAP analysis (both depend
on check only). PR comments are upserted on pull requests.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Verify Everything

- [ ] **Step 1: Run full verification**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: All pass.

- [ ] **Step 2: Smoke-test the local action path**

Run the command the action would run in local mode:
```bash
node dist/cli.js --format json --threshold 16 > /tmp/crap4ts-report.json
echo "Exit code: $?"
jq '.passed, .summary.totalFunctions, .summary.exceedingThreshold' /tmp/crap4ts-report.json
```
Expected: Valid JSON output with `passed`, `totalFunctions`, and `exceedingThreshold` fields.

- [ ] **Step 3: Smoke-test markdown output**

```bash
node dist/cli.js --format markdown --threshold 16
```
Expected: GFM table output with `## crap4ts Report` heading.

- [ ] **Step 4: Verify action.yml references are valid**

Check that `actions/upload-artifact@v4` is used (not v3), and all `${{ }}` expressions reference defined inputs/steps.

- [ ] **Step 5: Final commit if any fixes needed**

If any fixes were required during verification, commit them.
