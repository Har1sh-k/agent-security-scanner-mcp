/**
 * ClawProof - Security scanner for AI agent skills and prompts
 * Detects prompt injection, jailbreaks, and data exfiltration attempts
 *
 * @module clawproof
 */

// Detection patterns for prompt security analysis
export const DETECTION_PATTERNS = {
  promptInjection: [
    { name: 'Ignore Previous Instructions', regex: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|directives?|commands?|prompts?)/gi, severity: 'CRITICAL', points: 15, cwe: 'CWE-74' },
    { name: 'New Instructions Override', regex: /(from\s+now\s+on|starting\s+now|henceforth),?\s+(you\s+(will|must|should|shall)|act\s+as|behave\s+as)/gi, severity: 'CRITICAL', points: 15, cwe: 'CWE-74' },
    { name: 'System Override', regex: /(override|bypass|disable|turn\s+off)\s+(system|safety|security|filters?|restrictions?)/gi, severity: 'CRITICAL', points: 12, cwe: 'CWE-863' },
    { name: 'Role Manipulation', regex: /(you\s+are\s+(now|actually)|pretend\s+(you\s+are|to\s+be))\s+(a|an|the)?\s*\w+/gi, severity: 'HIGH', points: 10, cwe: 'CWE-269' },
  ],
  jailbreak: [
    { name: 'DAN Mode', regex: /(do\s+anything\s+now|DAN\s+mode)/gi, severity: 'CRITICAL', points: 20, cwe: 'CWE-269' },
    { name: 'Developer Mode', regex: /(developer\s+mode|debug\s+mode|unrestricted\s+mode)/gi, severity: 'CRITICAL', points: 15, cwe: 'CWE-269' },
    { name: 'Pretend Scenarios', regex: /in\s+a\s+(hypothetical|fictional|alternate)\s+(world|scenario|universe)/gi, severity: 'HIGH', points: 10, cwe: 'CWE-269' },
    { name: 'No Restrictions', regex: /(no\s+(restrictions?|limitations?|constraints?|rules?|ethics?|guidelines?))/gi, severity: 'CRITICAL', points: 15, cwe: 'CWE-269' },
  ],
  dataExfiltration: [
    { name: 'External URLs', regex: /https?:\/\/(?!.*\.(github\.com|githubusercontent\.com|npmjs\.(com|org)|pypi\.org))/gi, severity: 'HIGH', points: 8, cwe: 'CWE-200' },
    { name: 'Base64 Encoding', regex: /base64|atob|btoa/gi, severity: 'MEDIUM', points: 5, cwe: 'CWE-116' },
  ],
  hiddenInstructions: [
    { name: 'HTML Comments', regex: /<!--.*?(ignore|override|bypass|hidden|secret).*?-->/gis, severity: 'HIGH', points: 10, cwe: 'CWE-506' },
    { name: 'Hidden Instructions', regex: /(hidden|secret|invisible)\s+(instruction|command|directive)/gi, severity: 'HIGH', points: 10, cwe: 'CWE-506' },
  ]
};

/**
 * Calculate security grade based on total vulnerability points
 * @param {number} totalPoints - Sum of all vulnerability points
 * @returns {string} Grade from A to F
 */
export function calculateGrade(totalPoints) {
  if (totalPoints === 0) return 'A';
  if (totalPoints <= 10) return 'B';
  if (totalPoints <= 25) return 'C';
  if (totalPoints <= 50) return 'D';
  return 'F';
}

/**
 * Get recommendation text for a security grade
 * @param {string} grade - Security grade (A-F)
 * @returns {string} Recommendation message
 */
export function getRecommendation(grade) {
  const recommendations = {
    A: 'OK to install',
    B: 'Low risk - Review findings before use',
    C: 'Medium risk - Use with caution',
    D: 'High risk - Not recommended',
    F: 'DO NOT INSTALL - This skill contains critical security threats that pose immediate risk'
  };
  return recommendations[grade] || 'Unknown risk level';
}

/**
 * Scan content for prompt injection and security vulnerabilities
 * @param {string} content - The text content to scan (skill file, prompt, etc.)
 * @param {string} [filePath] - Optional file path for reference
 * @returns {object} Scan results with grade, findings, and recommendation
 */
export function scanContent(content, filePath = 'unknown') {
  const findings = [];
  let totalPoints = 0;

  for (const [category, patterns] of Object.entries(DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern.regex);
      for (const match of matches) {
        findings.push({
          category: `prompt-injection-${category}`,
          severity: pattern.severity,
          message: `${pattern.name} detected: Potential security threat.`,
          matched_text: match[0].substring(0, 100),
          line: content.substring(0, match.index).split('\n').length,
          file: filePath,
          source: 'clawproof',
          rule_id: `generic.prompt.security.${pattern.name.toLowerCase().replace(/\s+/g, '-')}`,
          confidence: 'HIGH',
          cwe: pattern.cwe
        });
        totalPoints += pattern.points;
      }
    }
  }

  const grade = calculateGrade(totalPoints);
  const recommendation = getRecommendation(grade);

  return {
    file_path: filePath,
    grade,
    score: totalPoints,
    findings_count: findings.length,
    recommendation,
    findings,
    scanned_at: new Date().toISOString(),
    scanner_version: '1.0.0'
  };
}

/**
 * Scan a file for security vulnerabilities
 * @param {string} filePath - Path to file to scan
 * @returns {Promise<object>} Scan results
 */
export async function scanFile(filePath) {
  const { readFile } = await import('fs/promises');
  try {
    const content = await readFile(filePath, 'utf-8');
    return scanContent(content, filePath);
  } catch (error) {
    return {
      file_path: filePath,
      error: error.message,
      grade: 'F',
      score: 0,
      findings_count: 0,
      recommendation: 'Error scanning file',
      findings: [],
      scanned_at: new Date().toISOString(),
      scanner_version: '1.0.0'
    };
  }
}

/**
 * Scan multiple files in a directory
 * @param {string} dirPath - Directory path to scan
 * @param {object} options - Scan options
 * @param {string} [options.pattern='SKILL.md'] - File pattern to match
 * @param {boolean} [options.recursive=true] - Scan subdirectories
 * @returns {Promise<Array>} Array of scan results
 */
export async function scanDirectory(dirPath, options = {}) {
  const { readdir, stat } = await import('fs/promises');
  const { join } = await import('path');

  const pattern = options.pattern || 'SKILL.md';
  const recursive = options.recursive !== false;
  const results = [];

  async function scanDir(dir) {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (stats.isFile() && entry === pattern) {
        const result = await scanFile(fullPath);
        results.push({
          slug: entry.replace(/\.md$/, ''),
          ...result
        });
      }
    }
  }

  await scanDir(dirPath);
  return results;
}

/**
 * Generate grade distribution from scan results
 * @param {Array} results - Array of scan results
 * @returns {object} Grade distribution statistics
 */
export function getGradeDistribution(results) {
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0, ERROR: 0 };

  for (const result of results) {
    if (result.error) {
      distribution.ERROR++;
    } else {
      distribution[result.grade] = (distribution[result.grade] || 0) + 1;
    }
  }

  return distribution;
}

/**
 * Find most dangerous items from scan results
 * @param {Array} results - Array of scan results
 * @param {number} [limit=20] - Maximum number of results to return
 * @returns {Array} Top dangerous items sorted by severity
 */
export function getMostDangerous(results, limit = 20) {
  return results
    .filter(r => !r.error && r.findings_count > 0)
    .sort((a, b) => {
      const gradeOrder = { F: 5, D: 4, C: 3, B: 2, A: 1 };
      const gradeCompare = gradeOrder[b.grade] - gradeOrder[a.grade];
      if (gradeCompare !== 0) return gradeCompare;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export default {
  DETECTION_PATTERNS,
  scanContent,
  scanFile,
  scanDirectory,
  calculateGrade,
  getRecommendation,
  getGradeDistribution,
  getMostDangerous
};
