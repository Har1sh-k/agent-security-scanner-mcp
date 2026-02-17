# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.9.0] - 2026-02-17

### Added
- **`scan_mcp_server` Tool** - New tool to audit MCP server source code for security vulnerabilities. Returns A-F security grade with 24+ detection rules covering insecure patterns, overly broad permissions, hardcoded secrets, eval/exec usage, and MCP-specific attack vectors
- **Unicode / Homoglyph Poisoning Detection** - Detects zero-width characters (U+200B/C/D, FEFF, 2060), bidirectional override characters (U+202A-202E), and Cyrillic/ASCII homoglyph substitutions (`mcp.unicode-zero-width`, `mcp.unicode-bidi-override`, `mcp.unicode-homoglyph`)
- **Tool Name Spoofing Detection** - Levenshtein-distance comparison against 35 well-known MCP tool names; flags tool names ≤2 edits from known tools (e.g. `readFi1e` spoofing `readFile`) — covers Adversa AI TOP25 #9
- **Tool Description Injection Classifier** - Detects imperative/injection-style language in tool descriptions (`ignore previous`, `exfiltrate`, `override instructions`, etc.) — covers Adversa AI TOP25 #2 #3
- **`server.json` Manifest Parsing** - `manifest: true` parameter scans MCP manifest alongside source code, catching poisoning that lives in the manifest rather than source
- **Rug Pull Detection** - `update_baseline: true` hashes each tool's name+description into `.mcp-security-baseline.json`; future scans alert with `mcp.rug-pull-detected` on any tool change (added, modified, or removed) — covers Adversa AI TOP25 #6
- **`scan_agent_action` Tool** - Pre-execution safety check for concrete agent actions (bash, file_write, file_read, http_request, file_delete). Returns ALLOW/WARN/BLOCK. Lighter-weight than `scan_agent_prompt` for evaluating specific operations
- 29 new tests for `scan_mcp_server` (unicode poisoning, description injection, tool name spoofing, manifest parsing, rug pull — all 5 detection categories)

### Changed
- Root repo is now the canonical npm release source (`mcp-server/` subdirectory removed — was a duplicate)
- README updated: `scan_mcp_server` and `scan_agent_action` added to tools table (Tools count: 8 → 10), full reference sections added, Side Effects note updated

## [3.8.0] - 2026-02-16

### Added
- **Cross-File Taint Analysis**: Tracks vulnerabilities across file boundaries with three-phase analysis (per-file, export summaries, cross-file propagation)
- **Project Context Discovery**: Auto-detects frameworks (Express, Django, Flask, Spring Boot, Rails, etc.), security middleware (helmet, cors, DOMPurify), and auth libraries (passport, bcrypt, jsonwebtoken)
- **Layer 2 Security Review**: New `security-review` skill for LLM-powered project-aware code analysis that verifies Layer 1 findings and catches logic bugs
- **Import Graph Resolution**: New `import-resolver.js` with cycle detection, content-hash caching, and multi-language support (JS/TS, Python, Go)
- **Function Export Analysis**: `FunctionTaintSummary` dataclass and `analyze_function_exports()` method in `taint_analyzer.py`
- New MCP tool parameters: `project_context` and `resolve_imports` on `scan_security`
- New files: `skills/security-review.md`, `src/tools/project-context.js`, `src/tools/import-resolver.js`, `src/tools/scan-project.js`
- Comprehensive test coverage: 19 pytest tests (`tests/cross_file_taint_test.py`), 61 vitest tests (`tests/import-resolver.test.js`, `tests/project-context.test.js`)
- Realistic Express app test fixture: `tests/fixtures/express-app/`

### Changed
- Enhanced `cross_file_analyzer.py` with export analysis (+437 lines)
- Enhanced `scan-security.js` with project context and import graph integration
- Updated `CLAUDE.md` with two-layer security analysis documentation

### Fixed
- Cross-file SQL injection detection when tainted input originates in different files
- False positives reduced by understanding project-level defenses (framework protections, middleware)

## [3.1.0] - 2026-02-10

### Fixed
- **Bug 1**: npm bloom filter now ships with the package (3.78M packages, 8.6MB)
- **Bug 2**: `detectLanguage()` now supports .cs, .rs, .c, .cpp, .h, .hpp, .tf, .hcl, .yaml, .yml, .sql, and Dockerfile
- **Bug 3**: Created `mcp-server/rules/__init__.py` with recursive `os.walk()` rule loading for subdirectory rules (csharp/, rust/, c/, etc.)
- **Bug 4**: AST engine diagnostics — narrowed exception handler, added `engine` field to findings, stderr logging
- **Bug 5**: Taint analysis verification — added taint finding logging and `engine: 'taint'` field
- **Bug 6**: Cross-language secret fix templates via `envVarReplacement()` helper (Go, Java, PHP, Ruby, C#, Rust, C/C++)
- **Bug 7**: `sensitivity_level` now has meaningful impact — wider multipliers (1.5x/0.5x) and threshold adjustments in `determineAction()`
- **Bug 8**: `list_package_stats` now reports bloom filter status per ecosystem
- **Bug 9**: `previous_messages` multi-turn escalation detection in `scan_agent_prompt`
- **Bug 10**: `scan_packages` no longer reports "All packages verified" when packages are unknown

### Added
- `envVarReplacement()` helper for idiomatic env var access across 9 languages
- Role-switching attack patterns in prompt injection rules (System: prefix, role reassignment)
- npm bloom filter generation script (`scripts/fetch-npm-packages.js`)
- Test fixtures: vuln-csharp.cs, vuln-rust.rs, vuln-go.go, test-packages-npm.js
- Language detection tests, cross-language fix tests, sensitivity/multi-turn/role-switching prompt tests

### Changed
- Version bump from 2.0.4 to 3.1.0

## [2.3.1] - 2026-02-06

### Added
- MIT LICENSE file (Copyright 2026 Sinewave AI)
- MCP Registry manifest (server.json) for mcp-publisher submission
- 4 new keywords: zed, prompt-firewall, auto-fix, hallucination (38 total)

### Changed
- SEO-optimized package.json description (accurate counts: 359 rules, 4.3M+ packages)
- Fixed author email format to npm canonical angle-bracket style
- Added LICENSE and server.json to npm files array

## [2.3.0] - 2026-02-06

### Added
- Vitest test framework with 51 tests across 7 test files
- Test fixtures for Python, JavaScript vulnerabilities and clean files
- GitHub Actions CI workflow (Node 18/20/22, Python 3.12)
- CHANGELOG.md following Keep a Changelog format
- Prerequisites section in README

### Changed
- Updated README with accurate package counts and rule counts
- Updated package.json author field
- Added test scripts to package.json

## [2.2.0] - 2026-02-06

### Added
- risk_score and action metadata to all 13 generic.prompt.* rules
- 6 new jailbreak-roleplay patterns (pretend you're a hacker, act as a hacker, etc.)
- 5 new ignore-previous-instructions patterns (ignore the above and instead, forget everything above, etc.)
- 7 new base64-encoded-injection patterns (follow decoded instructions, known base64 fragments, etc.)
- New rule: generic.prompt.security.codeblock-obfuscation (attacks hidden in code blocks)
- New rule: generic.prompt.security.natural-language-exfiltration (data exfiltration via natural language)
- Code block extraction preprocessing in scan_agent_prompt
- Runtime base64 decode-and-rescan in scan_agent_prompt
- 6 new CATEGORY_WEIGHTS entries (prompt-injection-encoded, -context, -privilege, -multi-turn, -output, unknown)

### Changed
- Lowered RISK_THRESHOLDS: HIGH 70→65, MEDIUM 50→40, LOW 25→20
- Bumped CATEGORY_WEIGHTS: prompt-injection-content 0.9→1.0, prompt-injection-jailbreak 0.85→1.0
- Enhanced compound boosting: cross-category boost (0.15), mixed-severity boost (1.1x)

### Fixed
- Prompt injection detection rate improved from ~33% to 80%+

## [2.1.0] - 2026-02-06

### Fixed
- check_package handler now calls isHallucinated() directly instead of short-circuiting on empty Set
- scan_packages handler now maps packages through isHallucinated() instead of short-circuiting
- Command injection vulnerability in runAnalyzer() - replaced execSync template string with execFileSync
- Added bloom_filter flag and confidence level to check_package/scan_packages responses
- Added unknown_count field to scan_packages response

### Added
- npm bloom filter (3.78M packages, 8.65MB) via generate-npm-bloom.js script
- Flutter SDK packages to dart.txt: flutter, flutter_driver, flutter_localizations, flutter_test, flutter_web_plugins

## [2.0.1] - 2026-01-15

### Initial
- MCP server with scan_security, fix_security, check_package, scan_packages, scan_agent_prompt tools
- Package hallucination detection via bloom filters (pypi, rubygems) and text lists (dart, perl, raku, crates)
- Prompt injection scanning with 13 generic.prompt rules
- 165+ security fix templates

## [1.0.0] - 2025-12-01

### Initial Release
- Core security scanning engine with Python analyzer
- YAML-based security rules (Python, JavaScript, Java, Go, Dockerfile, secrets)
- MCP server with stdio transport
