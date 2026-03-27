// Normalized SBOM component model — decoupled from any output format.
// CycloneDX, SPDX, and all tools operate on this model.

import { buildPurl } from './purl.js';

/**
 * Create a normalized component.
 * @param {{ name: string, version?: string, ecosystem: string, isDev?: boolean, isDirect?: boolean, scope?: string, namespace?: string }} opts
 * @returns {{ name: string, version: string, ecosystem: string, isDev: boolean, isDirect: boolean, scope: string, purl: string, namespace?: string }}
 */
export function createComponent({ name, version, ecosystem, isDev = false, isDirect = false, scope, namespace }) {
  return {
    name,
    version: version || 'unknown',
    ecosystem,
    isDev,
    isDirect,
    scope: scope || (isDev ? 'optional' : 'required'),
    purl: buildPurl(ecosystem, name, version, namespace),
    ...(namespace && { namespace }),
  };
}

/**
 * Create a dependency edge between two components.
 * @param {string} fromPurl - PURL of the dependent
 * @param {string} toPurl - PURL of the dependency
 * @returns {{ from: string, to: string }}
 */
export function createEdge(fromPurl, toPurl) {
  return { from: fromPurl, to: toPurl };
}

/**
 * Create a component list with metadata and dependency graph.
 * @param {object[]} components - Array of normalized components
 * @param {object[]} [edges=[]] - Array of dependency edges
 * @param {{ name?: string, version?: string, ecosystems?: string[] }} [metadata={}]
 * @returns {{ components: object[], edges: object[], metadata: object }}
 */
export function createComponentList(components = [], edges = [], metadata = {}) {
  const ecosystems = [...new Set(components.map(c => c.ecosystem))];
  return {
    components,
    edges,
    metadata: {
      name: metadata.name || 'unknown',
      version: metadata.version || '0.0.0',
      ecosystems,
      total: components.length,
      direct: components.filter(c => c.isDirect).length,
      dev: components.filter(c => c.isDev).length,
      ...metadata,
    },
  };
}
