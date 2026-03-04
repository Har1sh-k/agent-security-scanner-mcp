# Release Improvements & Recommendations for v3.17.0

## Code Quality Assessment

**Overall Grade:** B+ (up from C-)
**Security Grade:** B (up from D)
**Stability Grade:** B+ (up from C)
**Release Readiness:** 7/10 (up from 3/10)

---

## What Was Fixed

### Critical Security Issues (6 fixed)
1. ✅ CVE in @modelcontextprotocol/sdk
2. ✅ ReDoS in prompt scanner
3. ✅ Path traversal in skill scanner
4. ✅ Daemon race condition
5. ✅ Unhandled promise rejections
6. ✅ Temp file symlink attacks

### Important Reliability Issues (3 fixed)
7. ✅ Daemon process orphaning
8. ✅ Dependency vulnerabilities (ajv, hono, qs)
9. ✅ Improved error boundaries

---

## Proposed Improvements for v3.18.0

### 1. Complete Async/Await Migration in CLI
**Priority:** HIGH
**Effort:** 2-3 hours
**Impact:** Prevents hanging/corrupted output

**Current State:**
- Only first 6 CLI commands wrapped in async IIFE
- Remaining 10+ commands still use `.then().catch()`

**Action Items:**
```javascript
// Need to wrap these commands:
- scan-security
- check-package
- scan-packages
- scan-project
- scan-diff
- scan-mcp
- scan-action
- scan-skill
- scan-clawhub
- benchmark
- audit
- harden
```

**Implementation:**
```javascript
// Continue the pattern started in index.js:243-304
} else if (cliArgs[0] === 'scan-security') {
  try {
    loadPackageLists();
    const result = await scanSecurity({ file_path: filePath, verbosity, output_format: outputFormat });
    const output = JSON.parse(result.content[0].text);
    console.log(JSON.stringify(output, null, 2));
    process.exit(output.issues_count > 0 ? 1 : 0);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
// Repeat for all remaining commands
```

---

### 2. Memory Leak Fix in scan-project.js
**Priority:** HIGH
**Effort:** 2 hours
**Impact:** Enables scanning of large projects (1000+ files)

**Current State:**
- Loads all scan results into memory
- 1000 files × 20 issues/file = 20MB+ memory
- Causes OOM on large codebases

**Implementation:**
```javascript
// src/tools/scan-project.js
const MAX_ISSUES_IN_MEMORY = 10000;
const BATCH_SIZE = 100;

for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);

  for (const filePath of batch) {
    const result = await scanSecurity({
      file_path: filePath,
      verbosity: 'compact' // Not 'full'!
    });

    const parsed = JSON.parse(result.content[0].text);
    if (parsed.issues && Array.isArray(parsed.issues)) {
      const relativePath = relative(dirPath, filePath);
      byFile[relativePath] = parsed.issues.length;

      for (const issue of parsed.issues) {
        if (allIssues.length >= MAX_ISSUES_IN_MEMORY) {
          console.warn(`Issue limit reached (${MAX_ISSUES_IN_MEMORY}). Stopping collection.`);
          break;
        }
        allIssues.push({ ...issue, file: relativePath });
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
        const category = issue.ruleId?.split('.')[0] || 'other';
        byCategory[category] = (byCategory[category] || 0) + 1;
      }
    }
  }

  // Allow GC between batches
  if (global.gc) global.gc();
}
```

---

### 3. Levenshtein DoS Fix in scan-mcp.js
**Priority:** MEDIUM
**Effort:** 1 hour
**Impact:** Prevents CPU exhaustion on MCP manifest scanning

**Current State:**
- O(n*m) space complexity
- 100-character limit still allows 10,000 iterations

**Implementation:**
```javascript
// src/tools/scan-mcp.js
function levenshtein(a, b) {
  // Stricter limits
  if (a.length > 50 || b.length > 50) return 999;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length, n = b.length;

  // Space-optimized version (O(min(m,n)) space)
  if (m < n) [a, b, m, n] = [b, a, n, m];

  let prev = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i-1] === b[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j], curr[j-1], prev[j-1]);
    }
    prev = curr;
  }

  return prev[n];
}
```

---

### 4. Prototype Pollution Prevention
**Priority:** MEDIUM
**Effort:** 1 hour
**Impact:** Prevents Object prototype corruption

**Current State:**
- `extractPackagesFromManifest()` doesn't filter dangerous keys
- Malicious package.json could pollute prototypes

**Implementation:**
```javascript
// src/tools/scan-skill.js:extractPackagesFromManifest
if (fileName === 'package.json') {
  const pkg = JSON.parse(content);

  // Validate structure
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    return { ecosystem: null, packages: [] };
  }

  for (const depKey of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = pkg[depKey];
    if (!deps || typeof deps !== 'object' || Array.isArray(deps)) continue;

    // Filter out prototype pollution keys
    const validKeys = Object.keys(deps).filter(key =>
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      typeof key === 'string' &&
      key.length > 0 &&
      key.length < 256
    );

    packages.push(...validKeys);
  }
  return { ecosystem: 'npm', packages };
}
```

---

### 5. Add Structured Logging
**Priority:** LOW
**Effort:** 3 hours
**Impact:** Better debugging and monitoring

**Current State:**
- Uses `console.error()` and `console.warn()` inconsistently
- No log levels or structured output
- Hard to debug production issues

**Recommendation:**
```javascript
// Install winston or pino
npm install winston

// Create src/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scanner-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'scanner-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.error('Daemon startup failed', {
  error: err.message,
  restarts: this._restarts.length,
  daemon_script: DAEMON_SCRIPT
});
```

---

### 6. Integration Testing Suite
**Priority:** MEDIUM
**Effort:** 4-6 hours
**Impact:** Catches regressions before release

**Current State:**
- 28 test files, 420+ unit tests
- No integration tests for critical paths
- No tests for security fixes

**Recommended Tests:**
```javascript
// tests/integration/security-fixes.test.js
describe('Security Fixes v3.17.0', () => {
  describe('Path Traversal Prevention', () => {
    it('should reject symlinks to /etc', async () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'test-'));
      const skillDir = join(tmpDir, 'evil-skill');
      mkdirSync(skillDir);
      symlinkSync('/etc', join(skillDir, 'malicious'));

      const result = await scanSkill({
        skill_path: join(skillDir, 'malicious'),
        verbosity: 'minimal'
      });

      expect(result.content[0].text).toContain('error');
      expect(result.content[0].text).toContain('outside allowed');
    });
  });

  describe('ReDoS Protection', () => {
    it('should timeout on malicious prompt within 2 seconds', async () => {
      const maliciousPrompt = 'a'.repeat(50000) +
        '```\n' + 'b'.repeat(50000) + '\n```\n';

      const start = Date.now();
      const result = await scanAgentPrompt({
        prompt_text: maliciousPrompt,
        verbosity: 'minimal'
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
      expect(result.content[0].text).toBeDefined();
    });
  });

  describe('Daemon Race Condition', () => {
    it('should handle concurrent scans without spawning multiple daemons', async () => {
      const results = await Promise.all([
        scanSecurity({ file_path: 'test1.py' }),
        scanSecurity({ file_path: 'test2.py' }),
        scanSecurity({ file_path: 'test3.py' })
      ]);

      expect(results).toHaveLength(3);
      // Verify only one daemon process exists
      const client = getDaemonClient();
      expect(client._restarts.length).toBeLessThanOrEqual(1);
    });
  });
});
```

---

### 7. Performance Monitoring
**Priority:** LOW
**Effort:** 2 hours
**Impact:** Identify bottlenecks

**Recommendation:**
```javascript
// Add prometheus metrics
npm install prom-client

// src/metrics.js
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

export const scanDuration = new Histogram({
  name: 'scanner_scan_duration_seconds',
  help: 'Duration of security scans',
  labelNames: ['tool', 'language'],
  registers: [register]
});

export const scanErrors = new Counter({
  name: 'scanner_errors_total',
  help: 'Total scan errors',
  labelNames: ['tool', 'error_type'],
  registers: [register]
});

export const daemonRestarts = new Counter({
  name: 'scanner_daemon_restarts_total',
  help: 'Total daemon restarts',
  registers: [register]
});

// Usage in src/tools/scan-security.js
const end = scanDuration.startTimer({ tool: 'scan_security', language });
try {
  const result = await runAnalyzerAsync(file_path, language, signal);
  return result;
} finally {
  end();
}
```

---

### 8. Security Policy Documentation
**Priority:** MEDIUM
**Effort:** 1 hour
**Impact:** Sets expectations for vulnerability reporting

**Create SECURITY.md:**
```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.17.x  | :white_check_mark: |
| 3.16.x  | :white_check_mark: |
| < 3.16  | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to:
- Email: security@example.com
- GitHub Security Advisories: https://github.com/sinewaveai/agent-security-scanner-mcp/security/advisories

Do NOT report security vulnerabilities in public issues.

Expected response time: 48 hours
Expected fix time: 7-14 days for critical issues

## Security Fixes in This Release

See [SECURITY-FIXES-v3.17.0.md](./SECURITY-FIXES-v3.17.0.md) for details.
```

---

## Version Bump Recommendation

**Recommended Version:** `3.17.0`

**Justification:**
- MINOR version bump (not PATCH) because:
  - Multiple API-compatible security fixes
  - New error handling patterns
  - Improved resource management
- Not MAJOR because:
  - No breaking changes
  - Backward compatible
  - No API changes

**Update package.json:**
```json
{
  "version": "3.17.0",
  "description": "Security scanner for AI coding agents - v3.17.0 with critical security fixes"
}
```

---

## Pre-Release Checklist

- [x] All npm audit vulnerabilities fixed
- [ ] All unit tests pass (waiting for results)
- [ ] Integration tests added and passing
- [ ] Documentation updated (README.md, CHANGELOG.md)
- [ ] SECURITY.md created
- [ ] Version bumped in package.json
- [ ] Git tag created: `v3.17.0`
- [ ] Release notes prepared
- [ ] npm publish dry-run successful

---

## Post-Release Monitoring

### Week 1
- Monitor npm download stats
- Watch for bug reports on GitHub
- Check error rates in production (if telemetry available)

### Week 2-4
- Address any reported issues
- Plan v3.18.0 with remaining improvements
- Consider backporting critical fixes to v3.16.x

---

## Long-Term Roadmap

### v3.18.0 (4-6 weeks)
- Complete async/await migration
- Memory leak fix
- Levenshtein optimization
- Prototype pollution fix
- Integration test suite

### v3.19.0 (8-10 weeks)
- Structured logging with winston
- Prometheus metrics
- Performance benchmarking suite
- Circuit breaker for daemon restarts

### v4.0.0 (3-4 months)
- Breaking changes if needed
- Major architecture improvements
- New security features

---

**Prepared by:** Claude Code Review & Planning Agent
**Date:** 2026-03-04
**Review ID:** v3.17.0-improvements
