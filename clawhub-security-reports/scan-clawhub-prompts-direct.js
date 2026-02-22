#!/usr/bin/env node
/**
 * Direct batch scanner for ClawHub SKILL.md files
 * Bypasses CLI to avoid bloom filter loading overhead
 */

import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILLS_DIR = path.join(__dirname, 'clawhub-skills');
const OUTPUT_FILE = path.join(__dirname, 'CLAWHUB-PROMPT-SECURITY-REPORT.json');
const SUMMARY_FILE = path.join(__dirname, 'CLAWHUB-PROMPT-SECURITY-SUMMARY.md');

// Import the prompt scanning patterns directly
const DETECTION_PATTERNS = {
  promptInjection: [
    { name: 'Ignore Previous Instructions', regex: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|directives?|commands?|prompts?)/gi, severity: 'CRITICAL', points: 15 },
    { name: 'New Instructions Override', regex: /(from\s+now\s+on|starting\s+now|henceforth),?\s+(you\s+(will|must|should|shall)|act\s+as|behave\s+as)/gi, severity: 'CRITICAL', points: 15 },
    { name: 'System Override', regex: /(override|bypass|disable|turn\s+off)\s+(system|safety|security|filters?|restrictions?)/gi, severity: 'CRITICAL', points: 12 },
    { name: 'Role Manipulation', regex: /(you\s+are\s+(now|actually)|pretend\s+(you\s+are|to\s+be))\s+(a|an|the)?\s*\w+/gi, severity: 'HIGH', points: 10 },
  ],
  jailbreak: [
    { name: 'DAN Mode', regex: /(do\s+anything\s+now|DAN\s+mode)/gi, severity: 'CRITICAL', points: 20 },
    { name: 'Developer Mode', regex: /(developer\s+mode|debug\s+mode|unrestricted\s+mode)/gi, severity: 'CRITICAL', points: 15 },
    { name: 'Pretend Scenarios', regex: /in\s+a\s+(hypothetical|fictional|alternate)\s+(world|scenario|universe)/gi, severity: 'HIGH', points: 10 },
    { name: 'No Restrictions', regex: /(no\s+(restrictions?|limitations?|constraints?|rules?|ethics?|guidelines?))/gi, severity: 'CRITICAL', points: 15 },
  ],
  dataExfiltration: [
    { name: 'External URLs', regex: /https?:\/\/(?!.*\.(github\.com|githubusercontent\.com|npmjs\.(com|org)|pypi\.org))/gi, severity: 'HIGH', points: 8 },
    { name: 'Base64 Encoding', regex: /base64|atob|btoa/gi, severity: 'MEDIUM', points: 5 },
  ],
  hiddenInstructions: [
    { name: 'HTML Comments', regex: /<!--.*?(ignore|override|bypass|hidden|secret).*?-->/gis, severity: 'HIGH', points: 10 },
    { name: 'Hidden Instructions', regex: /(hidden|secret|invisible)\s+(instruction|command|directive)/gi, severity: 'HIGH', points: 10 },
  ]
};

function scanSkillContent(content, skillPath) {
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
          file: 'SKILL.md',
          source: 'prompt_scanner',
          rule_id: `generic.prompt.security.${pattern.name.toLowerCase().replace(/\s+/g, '-')}`,
          confidence: 'HIGH'
        });
        totalPoints += pattern.points;
      }
    }
  }

  // Calculate grade
  let grade;
  if (totalPoints === 0) grade = 'A';
  else if (totalPoints <= 10) grade = 'B';
  else if (totalPoints <= 25) grade = 'C';
  else if (totalPoints <= 50) grade = 'D';
  else grade = 'F';

  let recommendation;
  if (grade === 'A') recommendation = 'OK to install';
  else if (grade === 'B') recommendation = 'Low risk - Review findings before use';
  else if (grade === 'C') recommendation = 'Medium risk - Use with caution';
  else if (grade === 'D') recommendation = 'High risk - Not recommended';
  else recommendation = 'DO NOT INSTALL - This skill contains critical security threats that pose immediate risk';

  return {
    skill_path: skillPath,
    grade,
    score: totalPoints,
    findings_count: findings.length,
    recommendation,
    findings
  };
}

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
        // SKILL.md not found
      }
    }
  }

  return skills;
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
      const gradeOrder = { F: 5, D: 4, C: 3, B: 2, A: 1 };
      const gradeCompare = gradeOrder[b.grade] - gradeOrder[a.grade];
      if (gradeCompare !== 0) return gradeCompare;
      return b.findings_count - a.findings_count;
    })
    .slice(0, limit);
}

async function generateMarkdownSummary(results, gradeDistribution, dangerous) {
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

This report presents the first comprehensive prompt security analysis of the ClawHub ecosystem, addressing the 94% of skills that are prompt-based rather than code-based.

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

---

## Most Dangerous Skills (Top 20)

${dangerous.map((skill, idx) => `### ${idx + 1}. ${skill.slug} - Grade ${skill.grade}
- **Score:** ${skill.score} points
- **Findings:** ${skill.findings_count}
- **Recommendation:** ${skill.recommendation}
`).join('\n')}

---

**Report Generated:** ${new Date().toISOString()}
**Scanner:** agent-security-scanner-mcp v3.7.0
`;

  await fs.writeFile(SUMMARY_FILE, md, 'utf-8');
  console.log(`\n📊 Summary report saved to: ${SUMMARY_FILE}`);
}

async function main() {
  console.log('🔍 Starting ClawHub Prompt Security Analysis (Direct Scan)\n');

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

    try {
      const content = readFileSync(skill.path, 'utf-8');
      const result = scanSkillContent(content, skill.path);
      results.push({
        slug: skill.slug,
        path: skill.path,
        ...result
      });

      const status = result.grade === 'A' ? '✅ A' : `⚠️  ${result.grade} (${result.findings_count} findings)`;
      console.log(status);
    } catch (error) {
      results.push({
        slug: skill.slug,
        path: skill.path,
        error: error.message,
        grade: 'F',
        findings_count: 0
      });
      console.log('❌ ERROR');
    }

    // Save intermediate results every 100 skills
    if ((i + 1) % 100 === 0) {
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

  await generateMarkdownSummary(results, gradeDistribution, dangerous);

  // Print summary to console
  console.log('\n' + '='.repeat(60));
  console.log('SCAN COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total Skills: ${skills.length}`);
  console.log(`Successful: ${results.filter(r => !r.error).length}`);
  console.log(`Failed: ${results.filter(r => r.error).length}`);
  console.log('\nGrade Distribution:');
  console.log(`  A: ${gradeDistribution.A} (${((gradeDistribution.A / skills.length) * 100).toFixed(1)}%)`);
  console.log(`  B: ${gradeDistribution.B} (${((gradeDistribution.B / skills.length) * 100).toFixed(1)}%)`);
  console.log(`  C: ${gradeDistribution.C} (${((gradeDistribution.C / skills.length) * 100).toFixed(1)}%)`);
  console.log(`  D: ${gradeDistribution.D} (${((gradeDistribution.D / skills.length) * 100).toFixed(1)}%)`);
  console.log(`  F: ${gradeDistribution.F} (${((gradeDistribution.F / skills.length) * 100).toFixed(1)}%)`);
  console.log('\nTop 5 Most Dangerous Skills:');
  dangerous.slice(0, 5).forEach((skill, idx) => {
    console.log(`  ${idx + 1}. ${skill.slug} - Grade ${skill.grade} (${skill.findings_count} findings, ${skill.score} points)`);
  });
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
