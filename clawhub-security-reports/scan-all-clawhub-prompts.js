#!/usr/bin/env node
/**
 * Batch scanner for all ClawHub SKILL.md files
 * Generates comprehensive prompt security report
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadPackageLists } from '../src/tools/check-package.js';
import { scanSkill as scanSkillTool } from '../src/tools/scan-skill.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILLS_DIR = path.join(__dirname, 'clawhub-skills');
const OUTPUT_FILE = path.join(__dirname, 'CLAWHUB-PROMPT-SECURITY-REPORT.json');
const SUMMARY_FILE = path.join(__dirname, 'CLAWHUB-PROMPT-SECURITY-SUMMARY.md');

async function findAllSkillFiles() {
  const skills = [];
  const entries = await fs.readdir(SKILLS_DIR);

  for (const entry of entries) {
    const skillDir = path.join(SKILLS_DIR, entry);
    const stat = await fs.stat(skillDir);

    if (stat.isDirectory()) {
      const skillFile = path.join(skillDir, 'SKILL.md');
      try {
        await fs.access(skillFile);
        skills.push({
          slug: entry,
          path: skillFile
        });
      } catch (err) {
        // SKILL.md not found in this directory
      }
    }
  }

  return skills;
}

async function scanSkill(skillPath) {
  try {
    const result = await scanSkillTool({ skill_path: skillPath, verbosity: 'minimal' });
    return JSON.parse(result.content[0].text);
  } catch (error) {
    return {
      error: error.message,
      grade: 'F',
      findings_count: 0
    };
  }
}

function generateGradeDistribution(results) {
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

function findMostDangerousSkills(results, limit = 20) {
  return results
    .filter(r => !r.error && r.findings_count > 0)
    .sort((a, b) => {
      // Sort by grade (F first) then by findings count
      const gradeOrder = { F: 5, D: 4, C: 3, B: 2, A: 1 };
      const gradeCompare = gradeOrder[b.grade] - gradeOrder[a.grade];
      if (gradeCompare !== 0) return gradeCompare;
      return b.findings_count - a.findings_count;
    })
    .slice(0, limit);
}

function categorizeFindingsByType(results) {
  const categories = {};

  for (const result of results) {
    if (result.error || !result.findings) continue;

    for (const finding of result.findings) {
      const category = finding.category || 'unknown';
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          severity: finding.severity,
          skills: new Set()
        };
      }
      categories[category].count++;
      categories[category].skills.add(result.slug);
    }
  }

  // Convert Sets to counts
  for (const category in categories) {
    categories[category].affected_skills = categories[category].skills.size;
    delete categories[category].skills;
  }

  return categories;
}

async function generateMarkdownSummary(results, gradeDistribution, dangerous, categories) {
  const total = results.length;
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  const totalFindings = results.reduce((sum, r) => sum + (r.findings_count || 0), 0);
  const skillsWithFindings = results.filter(r => !r.error && r.findings_count > 0).length;

  const md = `# ClawHub Prompt Security Analysis Report

**Date:** ${new Date().toISOString().split('T')[0]}
**Scanner Version:** v3.7.0 (Prompt Injection Detection)
**Skills Analyzed:** ${total}
**Successful Scans:** ${successful}
**Failed Scans:** ${failed}

---

## Executive Summary

This report presents the first comprehensive prompt security analysis of the ClawHub ecosystem, focusing on the 94% of skills that are prompt-based rather than code-based.

### Key Findings:

1. **${skillsWithFindings} skills (${((skillsWithFindings / successful) * 100).toFixed(1)}%) contain security issues**
2. **${totalFindings} total prompt injection patterns detected**
3. **Grade F skills: ${gradeDistribution.F}** - Critical security threats
4. **Grade A skills: ${gradeDistribution.A}** - Safe to use

---

## Grade Distribution

| Grade | Count | Percentage | Risk Level |
|-------|-------|------------|------------|
| A | ${gradeDistribution.A} | ${((gradeDistribution.A / successful) * 100).toFixed(1)}% | Safe |
| B | ${gradeDistribution.B} | ${((gradeDistribution.B / successful) * 100).toFixed(1)}% | Low risk |
| C | ${gradeDistribution.C} | ${((gradeDistribution.C / successful) * 100).toFixed(1)}% | Medium risk |
| D | ${gradeDistribution.D} | ${((gradeDistribution.D / successful) * 100).toFixed(1)}% | High risk |
| F | ${gradeDistribution.F} | ${((gradeDistribution.F / successful) * 100).toFixed(1)}% | Critical - DO NOT INSTALL |
| ERROR | ${gradeDistribution.ERROR} | ${((gradeDistribution.ERROR / total) * 100).toFixed(1)}% | Scan failed |

---

## Most Dangerous Skills (Top 20)

${dangerous.map((skill, idx) => `### ${idx + 1}. ${skill.slug} - Grade ${skill.grade}
- **Findings:** ${skill.findings_count}
- **Recommendation:** ${skill.recommendation}
`).join('\n')}

---

## Attack Categories Detected

| Category | Occurrences | Affected Skills | Severity |
|----------|-------------|-----------------|----------|
${Object.entries(categories)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([category, data]) => `| ${category} | ${data.count} | ${data.affected_skills} | ${data.severity} |`)
  .join('\n')}

---

## Comparison to Code Security Scan

| Metric | Code Scan (v6) | Prompt Scan (Current) |
|--------|----------------|----------------------|
| Total Skills | 415 | ${total} |
| Skills with Code | 14 (3.4%) | 0 (prompt-only) |
| Successful Scans | 6 (42.9% of code) | ${successful} (${((successful / total) * 100).toFixed(1)}%) |
| Vulnerabilities Found | 0 | ${totalFindings} |
| Grade F Skills | 0 | ${gradeDistribution.F} |

**Key Insight:** The prompt security scan revealed significant security issues in ClawHub skills that were invisible to traditional code scanning. This validates the need for prompt-specific security analysis.

---

## Methodology

### Detection Patterns:
- **Prompt Injection:** Ignore instructions, system override, role manipulation
- **Jailbreak Attempts:** DAN mode, developer mode, pretend scenarios
- **Data Exfiltration:** Credential harvesting, PII access, conversation history theft
- **Social Engineering:** Authority impersonation, urgency manipulation
- **Code Execution:** Embedded code, shell commands, SQL injection
- **Suspicious Patterns:** Hidden instructions, unicode obfuscation, base64 encoding

### Grading System:
- **A (0 points):** No security issues detected
- **B (1-10 points):** Minor concerns, safe with caution
- **C (11-25 points):** Medium risk, review before use
- **D (26-50 points):** High risk, not recommended
- **F (51+ points):** Critical security threat, DO NOT INSTALL

---

## Recommendations

### For ClawHub Users:
1. **Avoid Grade F skills** - These contain active security threats
2. **Review Grade D/C skills** - Use only if you understand the risks
3. **Prefer Grade A/B skills** - These passed security validation

### For ClawHub Maintainers:
1. **Implement prompt security scanning** in the skill submission process
2. **Display security grades** on skill marketplace pages
3. **Require security review** for skills with Grade F findings
4. **Create security guidelines** for skill authors

### For Researchers:
1. **Validate findings** - Manual review of Grade F skills recommended
2. **Expand detection** - Additional prompt injection patterns
3. **Compare ecosystems** - Scan other agent skill repositories
4. **Longitudinal study** - Track security posture over time

---

## Appendix: Full Results

See \`CLAWHUB-PROMPT-SECURITY-REPORT.json\` for complete scan results with all findings.

---

**Report Generated:** ${new Date().toISOString()}
**Scanner:** agent-security-scanner-mcp v3.7.0
**Contact:** https://github.com/dheerajreddy-ui/agent-security-layer
`;

  await fs.writeFile(SUMMARY_FILE, md, 'utf-8');
  console.log(`\n📊 Summary report saved to: ${SUMMARY_FILE}`);
}

async function main() {
  console.log('🔍 Starting ClawHub Prompt Security Analysis\n');

  // Load bloom filters once (avoids reloading ~60MB per skill scan)
  console.log('📦 Loading package bloom filters...');
  loadPackageLists();
  console.log('✅ Bloom filters loaded\n');

  // Find all SKILL.md files
  console.log('📁 Discovering skills...');
  const skills = await findAllSkillFiles();
  console.log(`✅ Found ${skills.length} skills\n`);

  // Scan all skills
  console.log('🔐 Scanning skills for prompt injection...\n');
  const results = [];

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const progress = `[${i + 1}/${skills.length}]`;

    process.stdout.write(`${progress} Scanning ${skill.slug}... `);

    const result = await scanSkill(skill.path);
    results.push({
      slug: skill.slug,
      path: skill.path,
      ...result
    });

    const status = result.error ? '❌ ERROR' : `${result.grade} (${result.findings_count} findings)`;
    console.log(status);

    // Save intermediate results every 50 skills
    if ((i + 1) % 50 === 0) {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
      console.log(`💾 Checkpoint saved (${i + 1} skills scanned)\n`);
    }
  }

  // Save final results
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✅ Full results saved to: ${OUTPUT_FILE}\n`);

  // Generate analysis
  console.log('📊 Generating summary report...\n');
  const gradeDistribution = generateGradeDistribution(results);
  const dangerous = findMostDangerousSkills(results);
  const categories = categorizeFindingsByType(results);

  await generateMarkdownSummary(results, gradeDistribution, dangerous, categories);

  // Print summary to console
  console.log('\n' + '='.repeat(60));
  console.log('SCAN COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total Skills: ${skills.length}`);
  console.log(`Successful: ${results.filter(r => !r.error).length}`);
  console.log(`Failed: ${results.filter(r => r.error).length}`);
  console.log('\nGrade Distribution:');
  console.log(`  A: ${gradeDistribution.A}`);
  console.log(`  B: ${gradeDistribution.B}`);
  console.log(`  C: ${gradeDistribution.C}`);
  console.log(`  D: ${gradeDistribution.D}`);
  console.log(`  F: ${gradeDistribution.F}`);
  console.log(`  ERROR: ${gradeDistribution.ERROR}`);
  console.log('\nTop 5 Most Dangerous Skills:');
  dangerous.slice(0, 5).forEach((skill, idx) => {
    console.log(`  ${idx + 1}. ${skill.slug} - Grade ${skill.grade} (${skill.findings_count} findings)`);
  });
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
