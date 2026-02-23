# Integration Plan: Adversa AI MCP TOP 25 into agent-security-scanner-mcp

## Executive Summary

This plan maps all 25 vulnerabilities from the Adversa AI MCP Security TOP 25 framework to concrete new tools, rules, and detection capabilities within the `agent-security-scanner-mcp` package. The scanner already covers traditional AppSec issues (SQL injection, command injection, XSS) and has a prompt injection firewall. The gaps are primarily in **MCP-protocol-specific** attack vectors — tool poisoning, rug pulls, cross-server attacks, and agentic AI abuse patterns.

---

## Current Scanner Coverage vs. TOP 25

| # | Vulnerability | Already Covered? | Gap |
|---|--------------|-----------------|-----|
| 1 | Prompt Injection | ✅ Partial (`scan_agent_prompt`, 59 rules) | Needs MCP-context-aware injection patterns |
| 2 | Tool Poisoning | ❌ | New tool needed |
| 3 | Resource Poisoning (Indirect Injection via Data) | ❌ | New tool needed |
| 4 | Excessive Permissions / Privilege Escalation | ❌ | New tool needed |
| 5 | Command Injection | ✅ Full (AST + taint rules) | Minimal — add MCP `stdio` passthrough patterns |
| 6 | Rug Pull Attack | ❌ | New tool needed |
| 7 | Confused Deputy | ❌ | New tool needed |
| 8 | Credential Theft / Token Passthrough | ✅ Partial (hardcoded secrets rules) | Needs MCP token-forwarding detection |
| 9 | Tool Name Spoofing | ❌ | New tool needed |
| 10 | SQL Injection | ✅ Full | No gap |
| 11 | Supply Chain Attacks | ✅ Partial (`scan_packages`, 4.3M+ registries) | Needs MCP server provenance checks |
| 12 | Remote Code Execution | ✅ Partial (taint analysis) | Add MCP stdio/shell passthrough patterns |
| 13 | Session/Context Leakage | ❌ | New tool needed |
| 14 | Auth/AuthZ Bypass | ✅ Partial (general rules) | Needs MCP-specific auth audit |
| 15 | Server-Side Request Forgery (SSRF) | ✅ Partial | Add MCP resource-fetch patterns |
| 16 | Path Traversal | ✅ Full | Minimal gap |
| 17 | Data Leakage / Exfiltration | ❌ | New tool needed |
| 18 | Multi-Agent Compromise | ❌ | New tool needed |
| 19 | Schema Poisoning | ❌ | New tool needed |
| 20 | Shadow MCP Servers | ❌ | New tool needed |
| 21 | Typosquatting / Naming Confusion | ✅ Partial (package hallucination) | Extend to MCP server names |
| 22 | Identity Spoofing | ❌ | New tool needed |
| 23 | Overreliance on the LLM | ❌ | New tool needed (config audit) |
| 24 | MCP Preference Manipulation (MPMA) | ❌ | New tool needed |
| 25 | Insufficient Logging/Audit | ❌ | New tool needed |

**Summary: 12 fully/partially covered, 13 net-new capabilities required.**

---

## Phase 1: New MCP Tools to Build (High Priority)

These are new MCP tools to expose alongside the existing `scan_security`, `fix_security`, etc.

### Tool 1: `scan_mcp_server`
**Covers:** #2 Tool Poisoning, #3 Resource Poisoning, #6 Rug Pull, #9 Tool Name Spoofing, #19 Schema Poisoning

**What it does:** Analyzes an MCP server's `server.json` or tool manifest for poisoning indicators.

**Detection rules:**
- Hidden Unicode characters (zero-width spaces, RTL overrides, homoglyphs) in tool descriptions
- ANSI escape sequences in tool/resource descriptions
- Tool descriptions exceeding normal length thresholds (embedded instruction indicator)
- Instruction-like language in descriptions ("send", "exfiltrate", "ignore previous", "override")
- Schema fields with suspicious defaults or hidden parameters not documented in the description
- Tool names that are near-matches of well-known tools (Levenshtein distance check)
- Diff-based rug pull detection: compare current manifest against a pinned/cached baseline

**Implementation approach:**
1. Add a new rule category `/rules/mcp-server/` with ~40 initial rules
2. Parser for `server.json` and MCP tool registration payloads
3. Unicode analysis engine (detect zero-width chars, bidirectional overrides, confusable characters via ICU confusables.txt)
4. Description NLP classifier — flag imperative sentences directed at the LLM
5. Schema diffing module for rug pull detection (store hashes of approved tool schemas)

**Verbosity levels:**
- `minimal`: "3 poisoning indicators found"
- `compact`: List each finding with tool name, indicator type, severity
- `full`: Include raw Unicode codepoints, full description text, diff output

---

### Tool 2: `scan_mcp_config`
**Covers:** #4 Excessive Permissions, #14 Auth/AuthZ Bypass, #20 Shadow MCP Servers, #22 Identity Spoofing, #23 Overreliance on LLM, #25 Insufficient Logging

**What it does:** Audits MCP client/server configuration files for security misconfigurations.

**Detection rules:**
- Tools with overshoot permissions (filesystem access, network access, shell execution when not needed)
- Missing authentication on server endpoints (no OAuth, no API keys)
- Servers running without TLS
- No logging/audit trail configuration
- Servers using `stdio` transport without sandboxing
- Multiple servers with overlapping tool names (shadow server risk)
- Missing rate limiting configuration
- No input validation on tool parameters
- Server running as root or with elevated privileges
- Missing Content Security Policy headers on HTTP transport

**Implementation approach:**
1. Config file parsers for all major MCP clients (Claude Desktop `claude_desktop_config.json`, Cursor `.cursor/mcp.json`, Claude Code `.claude/settings.json`)
2. Permission matrix: map each tool to minimum required permissions, flag excess
3. Auth checker: verify servers declare authentication methods
4. Logging audit: check for logging configuration presence
5. Shadow server detector: enumerate all registered servers, flag duplicates or unknown entries

**Verbosity levels:**
- `minimal`: Security grade (A-F) with issue count
- `compact`: Each misconfiguration with remediation
- `full`: Complete config analysis with recommended secure configuration

---

### Tool 3: `scan_mcp_transport`
**Covers:** #7 Confused Deputy, #8 Credential Theft / Token Passthrough, #13 Session/Context Leakage, #17 Data Exfiltration, #18 Multi-Agent Compromise

**What it does:** Analyzes MCP server source code for runtime security issues in how data flows between client, server, and backend.

**Detection rules (new taint analysis sources/sinks):**

*Token/Credential flows:*
- Auth tokens forwarded from client request directly to backend API calls without validation
- Tokens logged in request/response bodies
- Tokens stored in shared/global state accessible across sessions
- Missing token expiry checks before forwarding

*Data leakage:*
- Tool responses including data from other users' sessions (shared state detection)
- Tool responses including data not requested by the tool's declared purpose
- Outbound HTTP requests to domains not in an allowlist
- Data written to world-readable files or logs

*Confused deputy:*
- Tool performing actions on behalf of user A using user B's context
- Missing origin validation on incoming requests
- Cross-tool data sharing without explicit user consent

**Implementation approach:**
1. Extend existing taint analyzer with MCP-specific sources: `request.headers.authorization`, `context.user`, `session.data`
2. New sinks: `fetch()`, `axios()`, `http.request()` with auth headers, `console.log()` with tokens, `fs.writeFile()` with sensitive data
3. Cross-file analysis for shared state patterns (`global`, module-level variables, Redis/Memcached shared keys)
4. ~60 new taint rules in `/rules/mcp-transport/`

---

### Tool 4: `scan_mcp_ecosystem`
**Covers:** #11 Supply Chain, #21 Typosquatting, #20 Shadow MCP Servers

**What it does:** Validates MCP server packages and registries for supply chain threats.

**Detection rules:**
- MCP server npm package names checked against known legitimate servers (similar to existing `check_package` but for MCP ecosystem)
- Typosquatting detection: Levenshtein distance, character substitution, and homoglyph analysis against known MCP server names
- Package age and download count checks (newly published with few downloads = suspicious)
- Dependency analysis: flag MCP servers with suspicious transitive dependencies
- Container image provenance: verify Docker image signatures and base image trustworthiness

**Implementation approach:**
1. Build a curated registry of known-good MCP servers (start with official Anthropic servers, community-verified servers)
2. Extend existing bloom filter approach to MCP server names
3. npm/PyPI metadata API integration for reputation scoring
4. Docker image layer analysis using `docker inspect`

---

## Phase 2: Extend Existing Tools (Medium Priority)

### Extend `scan_agent_prompt` (covers #1 deeper)
**New rules (~30):**
- MCP-context-aware injection: detect prompts that reference tool names, attempt tool invocation, or try to modify tool behavior
- Multi-turn injection: detect gradual privilege escalation across conversation turns
- Resource-embedded injection: detect instruction-like content in data that will be fed to the LLM as context
- Cross-server injection: detect prompts attempting to invoke tools from other connected servers

### Extend `scan_security` (covers #5, #12, #15, #16 deeper)
**New rules (~25):**
- MCP `stdio` transport command injection patterns
- Shell passthrough in MCP server tool handlers
- SSRF via MCP resource URIs (file://, http:// with internal IPs)
- Path traversal in MCP resource access patterns
- `eval()` and dynamic code execution in tool handlers

### Extend `scan_packages` (covers #11 deeper)
**New capability:**
- Scan MCP server `package.json` dependencies specifically
- Flag packages with known MCP-related CVEs (e.g., CVE-2025-6514, CVE-2025-49596)
- Check for post-install scripts that modify MCP configurations

---

## Phase 3: Advanced Capabilities (Lower Priority)

### Tool 5: `scan_mcp_runtime` (runtime monitoring)
**Covers:** #6 Rug Pull (runtime), #24 MPMA, #18 Multi-Agent

**What it does:** A lightweight runtime monitor that hooks into MCP client-server communication.

**Capabilities:**
- Hash tool descriptions at approval time; alert if they change (rug pull detection)
- Monitor tool invocation patterns for anomalies (unusual frequency, unexpected parameter values)
- Detect preference drift over conversation turns (MPMA)
- Log all cross-server tool invocations for audit

**Implementation:** This is the most complex addition — requires either a proxy layer or client plugin. Consider shipping as an optional companion module.

### Tool 6: `audit_mcp_compliance`
**Covers:** #25 Insufficient Logging, #23 Overreliance on LLM

**What it does:** Generates a compliance report mapping an MCP deployment against the TOP 25 framework.

**Output:** A scored report (similar to existing `scan_project` A-F grading) showing coverage against each of the 25 vulnerabilities.

---

## Implementation Roadmap

### Sprint 1 (Weeks 1-3): Foundation
- [ ] Create `/rules/mcp-server/` directory with rule schema
- [ ] Build Unicode analysis engine (zero-width chars, homoglyphs, bidirectional overrides)
- [ ] Build MCP manifest parser (`server.json`, tool registration payloads)
- [ ] Implement `scan_mcp_server` tool with initial 20 rules for tool poisoning
- [ ] Add tool to MCP server registration in `index.js`

### Sprint 2 (Weeks 4-5): Config & Ecosystem
- [ ] Build config parsers for Claude Desktop, Cursor, Claude Code, Windsurf
- [ ] Implement `scan_mcp_config` tool with permission matrix
- [ ] Implement `scan_mcp_ecosystem` with known-good server registry
- [ ] Extend `scan_packages` for MCP-specific CVE checks

### Sprint 3 (Weeks 6-7): Transport & Deep Analysis
- [ ] Add MCP-specific taint sources/sinks to `taint_analyzer.py`
- [ ] Implement `scan_mcp_transport` tool
- [ ] Add 30 new prompt injection rules for MCP context to `scan_agent_prompt`
- [ ] Add 25 new rules to `scan_security` for MCP server code patterns

### Sprint 4 (Weeks 8-9): Polish & Runtime
- [ ] Implement rug pull diff detection (schema hashing + comparison)
- [ ] Build `audit_mcp_compliance` scoring against TOP 25
- [ ] Prototype `scan_mcp_runtime` proxy layer
- [ ] Performance optimization: ensure new tools work within token budget constraints
- [ ] Update verbosity system for all new tools (minimal/compact/full)

### Sprint 5 (Week 10): Release
- [ ] Write documentation for all new tools
- [ ] Create test suites with known-vulnerable MCP server fixtures
- [ ] Benchmark precision/recall against Adversa AI's published CVE examples
- [ ] Release as major version (v4.0.0)

---

## Architecture: Where New Code Lives

```
agent-security-scanner-mcp/
├── src/
│   ├── tools/
│   │   ├── scan_mcp_server.ts      ← NEW
│   │   ├── scan_mcp_config.ts      ← NEW
│   │   ├── scan_mcp_transport.ts   ← NEW
│   │   ├── scan_mcp_ecosystem.ts   ← NEW
│   │   ├── audit_mcp_compliance.ts ← NEW
│   │   └── scan_mcp_runtime.ts     ← NEW (Phase 3)
│   ├── analyzers/
│   │   ├── unicode_analyzer.py     ← NEW (homoglyphs, zero-width, bidi)
│   │   ├── manifest_parser.py      ← NEW (server.json, tool schemas)
│   │   ├── config_auditor.py       ← NEW (client config security)
│   │   ├── schema_differ.py        ← NEW (rug pull detection)
│   │   └── mcp_taint_sources.py    ← NEW (extends taint_analyzer.py)
├── rules/
│   ├── mcp-server/                 ← NEW (~40 rules)
│   │   ├── tool-poisoning.yml
│   │   ├── schema-poisoning.yml
│   │   ├── name-spoofing.yml
│   │   └── resource-poisoning.yml
│   ├── mcp-config/                 ← NEW (~30 rules)
│   │   ├── excessive-permissions.yml
│   │   ├── missing-auth.yml
│   │   ├── shadow-servers.yml
│   │   └── insufficient-logging.yml
│   ├── mcp-transport/              ← NEW (~60 rules)
│   │   ├── token-passthrough.yml
│   │   ├── session-leakage.yml
│   │   ├── data-exfiltration.yml
│   │   └── confused-deputy.yml
│   └── mcp-ecosystem/              ← NEW (~20 rules)
│       ├── typosquatting.yml
│       └── supply-chain.yml
├── data/
│   ├── known-mcp-servers.json      ← NEW (curated legitimate server list)
│   ├── mcp-cve-database.json       ← NEW (MCP-specific CVEs)
│   └── unicode-confusables.txt     ← NEW (ICU confusables data)
```

---

## Scoring Integration

Each finding maps to the Adversa TOP 25 entry, enabling the `audit_mcp_compliance` tool to produce a score:

```json
{
  "top25_coverage": {
    "1_prompt_injection": { "rules": 89, "findings": 3, "severity": "critical" },
    "2_tool_poisoning": { "rules": 15, "findings": 1, "severity": "high" },
    ...
  },
  "overall_grade": "B",
  "score": 72,
  "methodology": "adversa_top25_v1"
}
```

---

## Key Technical Decisions

1. **Rule format:** YAML with Semgrep-compatible metavariable patterns, consistent with existing `/rules` directory
2. **Unicode analysis:** Use ICU confusables.txt (176KB) — fits within package size budget without bloating like npm bloom filter
3. **Rug pull detection:** SHA-256 hashing of tool schemas stored in `.mcp-security-baseline.json` in project root
4. **Config parsing:** Support all 7 client formats already listed in the scanner's `init` command
5. **Taint sources:** Extend `taint_analyzer.py` rather than creating a parallel analyzer — reuse the cross-file analysis daemon for performance
6. **SARIF output:** All new tools output SARIF 2.1.0 for GitHub Advanced Security integration, consistent with existing tools

---

## References

- [Adversa AI MCP Security TOP 25](https://adversa.ai/mcp-security-top-25-mcp-vulnerabilities/)
- [agent-security-scanner-mcp on npm](https://www.npmjs.com/package/agent-security-scanner-mcp)
- [agent-security-scanner-mcp on GitHub](https://github.com/sinewaveai/agent-security-scanner-mcp)
- [SecurityWeek Coverage of TOP 25](https://www.securityweek.com/top-25-mcp-vulnerabilities-reveal-how-ai-agents-can-be-exploited/)
- [Adversa AI MCP Security Issues Overview](https://adversa.ai/blog/mcp-security-issues/)
- [Invariant Labs: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [Elastic Security Labs: MCP Attack Vectors](https://www.elastic.co/security-labs/mcp-tools-attack-defense-recommendations)
