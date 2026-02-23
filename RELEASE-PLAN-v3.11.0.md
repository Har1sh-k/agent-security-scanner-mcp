# Release Plan: v3.11.0

**Version:** 3.11.0
**Type:** Minor Release
**Date:** February 23, 2026
**Previous Version:** 3.10.3

## Overview

This release adds comprehensive ClawHub/OpenClaw skill security scanning capabilities, including prompt injection detection, jailbreak analysis, and data exfiltration detection.

## What's New

### 1. ClawHub Skill Scanning (`scan_skill` MCP tool)

New MCP tool for scanning AI agent skills for security vulnerabilities:

```javascript
{
  "name": "scan_skill",
  "description": "Scan AI agent skill files (SKILL.md) for prompt injection, jailbreaks, and security issues",
  "inputSchema": {
    "file_path": "Path to SKILL.md file",
    "verbosity": "minimal|compact|full (default: compact)"
  }
}
```

**Detection Capabilities:**
- **Prompt Injection** (15 patterns): "ignore previous instructions", role manipulation, system overrides
- **Jailbreak Attempts** (4 patterns): DAN mode, developer mode, pretend scenarios, no restrictions
- **Data Exfiltration** (2 patterns): External URLs (with trusted domain whitelist), base64 encoding
- **Hidden Instructions** (2 patterns): HTML comments, secret directives

**Security Grading:**
- **Grade A** (0 points): Safe to install
- **Grade B** (1-10 points): Low risk - review findings
- **Grade C** (11-25 points): Medium risk - use with caution
- **Grade D** (26-50 points): High risk - not recommended
- **Grade F** (51+ points): DO NOT INSTALL - critical threats

### 2. ClawHub Batch Scanning CLI

New CLI commands for ecosystem-scale scanning:

```bash
# Scan entire ClawHub ecosystem
node index.js scan-clawhub

# Safe scanning (no code execution)
node index.js scan-clawhub-safe

# Full scanning with all analysis
node index.js scan-clawhub-full
```

### 3. Comprehensive Security Reports

Published security analysis of ClawHub ecosystem:

- **777 skills scanned** (100% success rate)
- **540 skills with security issues** (69.5%)
- **165 Grade F skills** (21.2% - critical vulnerabilities)
- **237 Grade A skills** (30.5% - completely safe)
- **4,129 total prompt injection patterns detected**

Reports available in `clawhub-security-reports/`:
- CLAWHUB-COMPREHENSIVE-SECURITY-REPORT.md
- CLAWHUB-TOP-50-DANGEROUS-SKILLS.md
- CLAWHUB-GRADE-DISTRIBUTION.md
- Plus detailed findings for all grades

### 4. ClawProof Standalone Package

Created standalone npm package `clawproof` (v1.0.0) for independent use:

```bash
npm install -g clawproof
clawproof scan ./SKILL.md
clawproof scan-text "your prompt here"
```

Features:
- 40+ detection patterns
- CWE mappings for all vulnerabilities
- Trusted domain whitelist (github.com, npmjs.org, etc.)
- 17 comprehensive tests (100% passing)

### 5. Infrastructure & Deployment

Added production scanning infrastructure:

- Docker-based isolated scanning environment
- GCP deployment automation scripts
- Non-preemptible instance configuration
- Remote scanning capabilities

## Breaking Changes

None. All changes are additive and backward compatible.

## Migration Guide

No migration required. New features are opt-in via:
- New `scan_skill` MCP tool
- New `scan-clawhub` CLI command
- ClawProof standalone package (separate installation)

## Testing

- **Unit Tests**: All existing tests passing + 17 new ClawProof tests
- **Integration Tests**: Scanned 777 real ClawHub skills
- **Performance**: ~3 minutes for 777 skills (prompt-only scanning)

## Files Changed

**New Files:**
- `src/tools/scan-skill-prompt.js` - Prompt injection detector
- `src/cli/scan-clawhub.js` - ClawHub scanning CLI
- `src/cli/scan-clawhub-safe.js` - Safe scanning CLI
- `src/cli/scan-clawhub-full.js` - Comprehensive scanning CLI
- `clawproof/` - Standalone npm package
- `clawproof-infra/` - Deployment infrastructure
- `clawhub-security-reports/` - Security analysis reports
- `demo/` - Demo scripts and examples

**Modified Files:**
- `index.js` - Added scan-clawhub command routing
- `package.json` - Added tar dependency
- `analyzer.py` - Suppressed regex warnings
- `.gitignore` - Added generated data exclusions

## Documentation Updates

### README.md

Add new section after "MCP Tools":

```markdown
### ClawHub/OpenClaw Skill Security

Scan AI agent skills for prompt injection, jailbreaks, and security threats:

**MCP Tool:**
```json
{
  "name": "scan_skill",
  "description": "Scan SKILL.md files for security vulnerabilities"
}
```

**CLI Usage:**
```bash
# Scan single skill
node index.js scan-skill ./path/to/SKILL.md

# Scan entire ClawHub ecosystem
node index.js scan-clawhub
```

**Standalone Package:**
```bash
npm install -g clawproof
clawproof scan ./SKILL.md
```

**Security Reports:**
We've scanned all 777 ClawHub skills and published comprehensive security reports in `clawhub-security-reports/`. Key findings:
- 69.5% of skills have security issues
- 21.2% have critical vulnerabilities (Grade F)
- 30.5% are completely safe (Grade A)

See [ClawHub Security Reports](./clawhub-security-reports/) for details.
```

## Deployment Steps

1. ✅ Update version in `package.json`
2. ✅ Update `README.md` with new features
3. ✅ Create/update `CHANGELOG.md`
4. ✅ Run all tests: `npm test`
5. ✅ Create version bump commit
6. ✅ Push to GitHub
7. ✅ Publish to npm: `npm publish`
8. ✅ Create GitHub release with notes
9. ✅ Announce on social media/community

## Rollback Plan

If issues are discovered:
1. `npm unpublish agent-security-scanner-mcp@3.11.0` (within 72 hours)
2. Or publish patch version 3.11.1 with fixes
3. Users can pin to v3.10.3: `"agent-security-scanner-mcp": "3.10.3"`

## Post-Release

- Monitor npm download statistics
- Watch for GitHub issues
- Gather user feedback on ClawHub scanning features
- Plan v3.12.0 with improvements

## Related Packages

- **clawproof** v1.0.0 - Already published separately
- **agent-security-scanner-mcp** v3.11.0 - This release

## Notes

- All ClawHub scanning features are optional
- Core MCP functionality unchanged
- Infrastructure files in `clawproof-infra/` are for advanced users
- Security reports provide transparency for ClawHub ecosystem
