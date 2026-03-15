// src/tools/compliance-controls.js — get_compliance_controls MCP tool (thin wrapper)

import { z } from 'zod';
import { loadControls, filterControls } from '../lib/compliance-controls.js';

export const complianceControlsSchema = {
  domain: z.enum(['security', 'safety', 'all']).optional().describe("Filter by domain"),
  control_ids: z.array(z.string()).optional().describe("Specific control IDs to retrieve"),
  owasp_filter: z.array(z.string()).optional().describe("Filter by OWASP LLM tags (e.g. LLM01)"),
  verbosity: z.enum(['minimal', 'compact', 'full']).optional().describe("Response detail level"),
};

export async function getComplianceControls({ domain, control_ids, owasp_filter, verbosity }) {
  const level = verbosity || 'compact';

  const controls = filterControls({
    domain: domain || 'all',
    controlIds: control_ids,
    owaspFilter: owasp_filter,
  });

  const registry = loadControls();

  let output;
  switch (level) {
    case 'minimal':
      output = {
        framework: registry.framework,
        controls_count: controls.length,
        controls: controls.map(c => ({ id: c.id, title: c.title, domain: c.domain })),
      };
      break;

    case 'full':
      output = {
        framework: registry.framework,
        schema_version: registry.schema_version,
        source: registry.source,
        source_snapshot: registry.source_snapshot,
        controls_count: controls.length,
        controls,
      };
      break;

    case 'compact':
    default:
      output = {
        framework: registry.framework,
        controls_count: controls.length,
        controls: controls.map(c => ({
          id: c.id,
          title: c.title,
          domain: c.domain,
          owasp_llm: c.owasp_llm,
          scanner_tools: c.scanner_tools,
          evaluation: c.evaluation,
        })),
      };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(output, null, 2),
    }],
  };
}
