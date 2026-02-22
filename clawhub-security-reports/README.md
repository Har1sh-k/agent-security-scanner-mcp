# ClawHub Security Reports

This folder contains the complete security analysis of the ClawHub ecosystem, including both code vulnerability scanning and prompt injection detection.

## Reports

### Comprehensive Analysis

- **CLAWHUB-COMPREHENSIVE-SECURITY-REPORT.md** (22KB)
  - Complete dual-layer security analysis combining code + prompt scanning
  - 30+ pages covering all findings, methodology, and recommendations
  - **START HERE** for complete overview

### Prompt Security Analysis

- **CLAWHUB-PROMPT-SECURITY-SUMMARY.md** (4.6KB)
  - Executive summary of prompt injection scan
  - Grade distribution and top 20 most dangerous skills
  - Quick reference for security grades

- **CLAWHUB-PROMPT-SECURITY-REPORT.json** (1.7MB)
  - Detailed findings for all 777 skills
  - Includes specific vulnerability patterns, matched text, and risk scores
  - Machine-readable format for programmatic access

### Code Security Analysis

- **CLAWHUB-SCAN-REPORT.md** (11KB)
  - Traditional code vulnerability scan results
  - Analysis of the 14 skills with implementation code
  - Documents the discovery that 94% of ClawHub is prompt-based

### Guides

- **CLAWHUB-SCAN-GUIDE.md** (5.7KB)
  - Instructions for running ClawHub security scans
  - Setup and configuration documentation

## Scanner Scripts

- **scan-clawhub-prompts-direct.js** (11KB)
  - Direct batch scanner that scans all 777 ClawHub skills
  - Bypasses CLI to avoid bloom filter loading overhead
  - Production-ready, ~3 minute execution time

- **scan-all-clawhub-prompts.js** (11KB)
  - CLI-based batch scanner (legacy)
  - Uses MCP server for scanning
  - Slower due to bloom filter loading

## Execution Logs

- **clawhub-direct-scan-output.log** (43KB)
  - Complete execution log from direct scanner
  - Shows progress and results for all 777 skills

- **clawhub-prompt-scan-output.log** (2.2KB)
  - Execution log from CLI-based scanner

## Key Statistics

### Scan Coverage
- **Total Skills Scanned:** 777 (100% of ClawHub ecosystem)
- **Prompt Security Success Rate:** 100% (777/777)
- **Code Security Scans:** 14 skills with implementation code

### Security Grades
| Grade | Count | Percentage | Risk Level |
|-------|-------|------------|------------|
| A | 237 | 30.5% | Safe |
| B | 152 | 19.6% | Low risk |
| C | 124 | 16.0% | Medium risk |
| D | 99 | 12.7% | High risk |
| F | 165 | 21.2% | **Critical - DO NOT INSTALL** |

### Top 5 Most Dangerous Skills
1. **woocommerce** - 75 findings, 600 points
2. **calendly-api** - 73 findings, 584 points
3. **klaviyo** - 55 findings, 437 points
4. **zoho-crm** - 54 findings, 432 points
5. **clickup-api** - 48 findings, 384 points

## Detection Patterns

### Prompt Injection (15 patterns)
- Ignore previous instructions
- New instructions override
- System override attempts
- Role manipulation

### Jailbreak Attempts (4 patterns)
- DAN (Do Anything Now) mode
- Developer/debug mode
- Pretend scenarios
- No restrictions patterns

### Data Exfiltration (2 patterns)
- External URLs (non-allowlist)
- Base64 encoding

### Hidden Instructions (2 patterns)
- HTML comment obfuscation
- Hidden instruction markers

## Usage

### View Specific Skill Findings

```bash
# Search for a specific skill in the JSON report
cat CLAWHUB-PROMPT-SECURITY-REPORT.json | jq '.[] | select(.slug == "woocommerce")'
```

### Re-run the Scan

```bash
# From parent directory
node clawhub-security-reports/scan-clawhub-prompts-direct.js
```

### Filter by Grade

```bash
# Get all Grade F skills
cat CLAWHUB-PROMPT-SECURITY-REPORT.json | jq '.[] | select(.grade == "F") | {slug, score, findings_count}'
```

## Research Impact

This analysis represents the **first comprehensive security assessment** of an AI agent skill marketplace, revealing:

1. **94% of ClawHub is prompt-based**, not code-based
2. **Prompt injection is the primary threat**, not code vulnerabilities
3. **69.5% of skills contain security issues**
4. **Traditional security tools are insufficient** for AI agent ecosystems

## Recommendations

### For Users
- Avoid Grade F skills (critical threats)
- Review findings before installing Grade D/C skills
- Prefer Grade A/B skills (validated as safe)

### For ClawHub Maintainers
- Implement mandatory security scanning
- Display security grades on marketplace
- Require security review for Grade F skills

### For Researchers
- Validate findings with manual review
- Expand detection patterns
- Compare across agent ecosystems

## Generated

**Date:** February 22, 2026
**Scanner Version:** v3.7.0
**Total Scan Time:** ~3 minutes (prompt scan) + 30 minutes (code scan)
**Total Cost:** $2.50 (GCP VM for code scanning)

## Contact

For questions or feedback:
- GitHub: https://github.com/dheerajreddy-ui/agent-security-layer
- Report issues or contribute improvements
