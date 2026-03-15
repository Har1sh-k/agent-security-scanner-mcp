// src/lib/compliance-controls.js — AIUC-1 controls registry loader + schema validator.

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirname;
try {
  __dirname = dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname = process.cwd();
}

const KNOWN_DOMAINS = new Set(['security', 'safety']);
const KNOWN_TOOLS = new Set([
  'scan_security', 'scan_agent_prompt', 'scan_project', 'scan_skill',
  'scan_mcp_server', 'scan_agent_action', 'scan_git_diff',
]);
const OWASP_TAG_RE = /^LLM\d{2}$/;

let _cache = null;

/**
 * Validate the controls registry schema. Returns array of error strings (empty = valid).
 */
export function validateRegistry(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Registry must be a non-null object');
    return errors;
  }

  if (!Array.isArray(data.controls)) {
    errors.push('Registry must have a "controls" array');
    return errors;
  }

  const ids = new Set();
  for (const ctrl of data.controls) {
    // Required fields
    if (!ctrl.id) errors.push(`Control missing "id"`);
    if (!ctrl.title) errors.push(`Control ${ctrl.id || '?'} missing "title"`);
    if (!ctrl.domain) errors.push(`Control ${ctrl.id || '?'} missing "domain"`);
    if (!ctrl.evaluation) errors.push(`Control ${ctrl.id || '?'} missing "evaluation"`);

    // Duplicate ID check
    if (ctrl.id && ids.has(ctrl.id)) {
      errors.push(`Duplicate control ID: ${ctrl.id}`);
    }
    ids.add(ctrl.id);

    // Domain validation
    if (ctrl.domain && !KNOWN_DOMAINS.has(ctrl.domain)) {
      errors.push(`Control ${ctrl.id}: unknown domain "${ctrl.domain}"`);
    }

    // Scanner tools validation
    if (Array.isArray(ctrl.scanner_tools)) {
      for (const tool of ctrl.scanner_tools) {
        if (!KNOWN_TOOLS.has(tool)) {
          errors.push(`Control ${ctrl.id}: unknown scanner tool "${tool}"`);
        }
      }
    }

    // OWASP tags validation
    if (Array.isArray(ctrl.owasp_llm)) {
      for (const tag of ctrl.owasp_llm) {
        if (!OWASP_TAG_RE.test(tag)) {
          errors.push(`Control ${ctrl.id}: invalid OWASP tag "${tag}" (expected LLM\\d{2})`);
        }
      }
    }

    // Evaluation field types
    if (ctrl.evaluation) {
      const ev = ctrl.evaluation;
      if (ev.max_aivss_posture !== undefined && typeof ev.max_aivss_posture !== 'number') {
        errors.push(`Control ${ctrl.id}: evaluation.max_aivss_posture must be a number`);
      }
      if (ev.max_critical_findings !== undefined && typeof ev.max_critical_findings !== 'number') {
        errors.push(`Control ${ctrl.id}: evaluation.max_critical_findings must be a number`);
      }
      if (ev.required_tools !== undefined) {
        if (!Array.isArray(ev.required_tools)) {
          errors.push(`Control ${ctrl.id}: evaluation.required_tools must be an array`);
        } else {
          for (const tool of ev.required_tools) {
            if (!KNOWN_TOOLS.has(tool)) {
              errors.push(`Control ${ctrl.id}: evaluation.required_tools references unknown tool "${tool}"`);
            }
          }
        }
      }
      if (ev.fail_on_severities !== undefined && !Array.isArray(ev.fail_on_severities)) {
        errors.push(`Control ${ctrl.id}: evaluation.fail_on_severities must be an array`);
      }
      if (ev.fail_on_actions !== undefined && !Array.isArray(ev.fail_on_actions)) {
        errors.push(`Control ${ctrl.id}: evaluation.fail_on_actions must be an array`);
      }
      if (ev.min_grade !== undefined && typeof ev.min_grade !== 'string') {
        errors.push(`Control ${ctrl.id}: evaluation.min_grade must be a string`);
      }
    }
  }

  return errors;
}

/**
 * Load the AIUC-1 controls registry. Validates on first load.
 * @returns {object} The full registry object
 */
export function loadControls() {
  if (_cache) return _cache;

  const controlsPath = join(__dirname, '..', '..', 'compliance', 'aiuc-1-controls.json');
  const data = JSON.parse(readFileSync(controlsPath, 'utf-8'));

  const errors = validateRegistry(data);
  if (errors.length > 0) {
    throw new Error(`AIUC-1 controls registry validation failed:\n${errors.join('\n')}`);
  }

  _cache = data;
  return data;
}

/**
 * Filter controls by domain, control IDs, or OWASP tags.
 * @param {object} [filters]
 * @param {string} [filters.domain] - 'security', 'safety', or 'all'
 * @param {string[]} [filters.controlIds] - Specific control IDs
 * @param {string[]} [filters.owaspFilter] - OWASP LLM tags to match
 * @returns {object[]} Filtered controls
 */
export function filterControls({ domain, controlIds, owaspFilter } = {}) {
  const registry = loadControls();
  let controls = registry.controls;

  if (domain && domain !== 'all') {
    controls = controls.filter(c => c.domain === domain);
  }

  if (controlIds && controlIds.length > 0) {
    const idSet = new Set(controlIds);
    controls = controls.filter(c => idSet.has(c.id));
  }

  if (owaspFilter && owaspFilter.length > 0) {
    const owaspSet = new Set(owaspFilter);
    controls = controls.filter(c =>
      Array.isArray(c.owasp_llm) && c.owasp_llm.some(tag => owaspSet.has(tag))
    );
  }

  return controls;
}

// Reset cache (for testing)
export function _resetCache() {
  _cache = null;
}
