# Threat Model: AIVSS Scoring + AIUC-1 Compliance

## Overview

The scanner provides two complementary threat modeling capabilities:

1. **AIVSS Scoring** — Per-finding vulnerability scores using the OWASP AI Vulnerability Scoring System v2
2. **AIUC-1 Compliance** — Structured evaluation against 16 security/safety controls from the AIUC-1 framework

## What is Deterministic

### AIVSS Formula
The AIVSS score computation is deterministic:
```
AIVSS = (0.25 × Base) + (0.45 × AI-Specific) + (0.30 × Impact)
```
Given the same metric values, the same score is always produced. The formula, weights, and metric value tables are pinned to a specific version of the OWASP calculator.

### Compliance Evaluation
Each control has structured evaluation rules (thresholds, required tools, severity checks). The evaluation logic is deterministic: given the same evidence, the same pass/partial/fail/not_evaluated result is produced.

## What is Inferred (Heuristic)

### Auto-Mapping: Findings → AIVSS Metrics
The scanner automatically maps finding attributes (severity, category, confidence) to AIVSS metric values. This mapping is **heuristic** — it makes reasonable assumptions but is not authoritative.

For example:
- A finding with `category: "exfiltration"` infers `AV: Network, MR: High, DS: High`
- A finding with `severity: "CRITICAL"` infers `AC: Low, PR: None, S: Changed`

The output explicitly labels this:
- `metrics.mapping_confidence`: HIGH, MEDIUM, or LOW
- `metrics.mapping_notes`: Human-readable reasoning for each inference

### Manual Overrides
For authoritative scoring, use the `overrides` parameter to set specific AIVSS metrics. Overrides always win over inferred values and are tracked in the `metrics.overridden` field.

## Compliance: Lookup vs Evaluation

### Control Lookup (`get_compliance_controls`)
Returns control definitions and their evaluation criteria. This is a **read-only lookup** — no findings are analyzed.

### Control Evaluation (in `report --threat-model`)
Takes scan results + AIVSS scores and produces pass/partial/fail per control. The evaluation follows structured rules:

1. **not_evaluated** — required tools were not run
2. **fail** — findings match fail_on_severities, fail_on_actions, or posture exceeds max threshold
3. **partial** — project grade below min_grade
4. **pass** — all checks passed

Controls whose `required_tools` are not available get `not_evaluated` with a reason explaining which tool is missing. **No tools are auto-run** — the user must supply additional scan evidence.

## Posture Score

The aggregate posture score is **not an OWASP standard**. It is explicitly labeled as `house-posture-v1`:

```
posture_score = max(max_finding_score, mean + 1σ)
```

This is worst-case-weighted: a single critical finding dominates the posture. The per-finding AIVSS scores are standards-based; only the aggregate is custom.

## Scoring Model Version

```json
{
  "name": "owasp-aivss",
  "version": "v2",
  "source_ref": "OWASP/www-project-ai-security@a1b2c3d/calculatorV2.py",
  "retrieved": "2026-03-14"
}
```

If the upstream OWASP calculator changes, the model version should be bumped explicitly.

## Usage

```bash
# JSON report with threat model
node index.js report <dir> --threat-model --json

# Score findings via MCP tool
# (accepts output from any scanner tool)

# Look up compliance controls via MCP tool
# (returns structured evaluation criteria)
```
