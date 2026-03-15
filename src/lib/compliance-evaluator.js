// src/lib/compliance-evaluator.js — Deterministic pass/partial/fail evaluation logic.

import { scoreBatch } from './aivss.js';

const GRADE_ORDER = { A: 4, B: 3, C: 2, D: 1, F: 0 };

/**
 * Check if actual grade is worse than threshold.
 * Missing/null grade → treated as F (worst case).
 */
function gradeIsWorse(actual, threshold) {
  const actualVal = GRADE_ORDER[actual] ?? 0; // null/missing → F → 0
  const thresholdVal = GRADE_ORDER[threshold] ?? 0;
  return actualVal < thresholdVal;
}

/**
 * Evaluate a single control against evidence.
 *
 * @param {object} control - A control from the registry
 * @param {object} evidence
 * @param {object|null} evidence.aivssPosture - Posture from scoreBatch, or null
 * @param {object[]} evidence.findings - Normalized findings from all available tools
 * @param {object} evidence.grades - Map of tool/scope → grade (e.g. { project: 'B' })
 * @param {string[]} evidence.toolsRun - Array of tool names whose output is available
 * @returns {{ control_id: string, status: string, reasons: string[] }}
 */
export function evaluateControl(control, evidence) {
  if (!control || !control.id || !control.evaluation) {
    return {
      control_id: control?.id || 'unknown',
      status: 'not_evaluated',
      reasons: ['Malformed control: missing id or evaluation'],
    };
  }

  const ev = control.evaluation;
  const reasons = [];
  const toolsRun = evidence.toolsRun || [];

  // 1. Check required_tools
  if (Array.isArray(ev.required_tools)) {
    for (const tool of ev.required_tools) {
      if (!toolsRun.includes(tool)) {
        return {
          control_id: control.id,
          status: 'not_evaluated',
          reasons: [`Missing required tool: ${tool}`],
        };
      }
    }
  }

  let status = 'pass';

  // Scope findings to this control's relevant tools
  const relevantTools = Array.isArray(control.scanner_tools) ? new Set(control.scanner_tools) : null;
  const relevantFindings = (evidence.findings || []).filter(f => {
    if (!relevantTools) return true;
    return relevantTools.has(f.source_tool);
  });

  // 2. Check fail_on_severities
  if (Array.isArray(ev.fail_on_severities) && ev.fail_on_severities.length > 0) {
    const sevSet = new Set(ev.fail_on_severities);
    const matched = relevantFindings.filter(f => sevSet.has(f.severity));
    if (matched.length > 0) {
      status = 'fail';
      reasons.push(`${matched.length} finding(s) with severity in [${ev.fail_on_severities.join(', ')}]`);
    }
  }

  // 3. Check fail_on_actions
  if (Array.isArray(ev.fail_on_actions) && ev.fail_on_actions.length > 0) {
    const actSet = new Set(ev.fail_on_actions);
    const matched = relevantFindings.filter(f => f.action && actSet.has(f.action));
    if (matched.length > 0) {
      status = 'fail';
      reasons.push(`${matched.length} finding(s) with action in [${ev.fail_on_actions.join(', ')}]`);
    }
  }

  // 4. Check max_aivss_posture (scoped to this control's relevant findings)
  if (typeof ev.max_aivss_posture === 'number' && relevantFindings.length > 0) {
    const scopedPosture = scoreBatch(relevantFindings).posture;
    if (scopedPosture.posture_score > ev.max_aivss_posture) {
      status = 'fail';
      reasons.push(`AIVSS posture ${scopedPosture.posture_score} exceeds max ${ev.max_aivss_posture}`);
    }
  }

  // 5. Check max_critical_findings (scoped to this control's tools)
  if (typeof ev.max_critical_findings === 'number') {
    const critCount = relevantFindings.filter(f => f.severity === 'CRITICAL').length;
    if (critCount > ev.max_critical_findings) {
      status = 'fail';
      reasons.push(`${critCount} CRITICAL finding(s) exceeds max ${ev.max_critical_findings}`);
    }
  }

  // 6. Check min_grade (scoped to control's relevant grade keys)
  if (ev.min_grade) {
    const grades = evidence.grades || {};
    // Only consider grades for tools this control cares about
    const relevantGradeKeys = relevantTools
      ? Object.keys(grades).filter(k => relevantTools.has(k) || relevantTools.has(`scan_${k}`))
      : Object.keys(grades);
    const gradeValues = relevantGradeKeys.map(k => grades[k]);
    if (gradeValues.length > 0) {
      const worstGrade = gradeValues.reduce((worst, g) => {
        return gradeIsWorse(g, worst) ? g : worst;
      }, gradeValues[0]);
      if (gradeIsWorse(worstGrade, ev.min_grade)) {
        if (status !== 'fail') status = 'partial';
        reasons.push(`Grade ${worstGrade || 'F'} below minimum ${ev.min_grade}`);
      }
    } else if (status !== 'fail') {
      // No relevant grades available → treat as F
      if (gradeIsWorse(null, ev.min_grade)) {
        status = 'partial';
        reasons.push(`No relevant grade available (treated as F), below minimum ${ev.min_grade}`);
      }
    }
  }

  return { control_id: control.id, status, reasons };
}

/**
 * Evaluate all controls against evidence.
 *
 * @param {object[]} controls - Array of controls from registry
 * @param {object} evidence - Same shape as evaluateControl
 * @returns {{ controls_evaluated: number, pass: number, partial: number, fail: number, not_evaluated: number, results: object[] }}
 */
export function evaluateAll(controls, evidence) {
  const results = controls.map(c => evaluateControl(c, evidence));

  const summary = { pass: 0, partial: 0, fail: 0, not_evaluated: 0 };
  for (const r of results) {
    summary[r.status] = (summary[r.status] || 0) + 1;
  }

  return {
    controls_evaluated: controls.length,
    ...summary,
    results,
  };
}
