# ClawHub Implementation Code Scanning Plan

**Goal:** Scan actual skill implementation code (not just SKILL.md docs) with minimal security risk

---

## Strategy Overview

We'll use a **multi-layered isolation** approach to safely download and scan real code:

1. **Read-only static analysis** (no code execution)
2. **Disposable isolated environments** (Docker + GCP VMs)
3. **Progressive risk mitigation** (start with GitHub repos, avoid npm install)
4. **Automated cleanup** (delete all downloaded code after scanning)

---

## Phase 1: Metadata Collection (SAFE - Already Done)

✅ **Status:** Completed in first scan

- Downloaded 415 SKILL.md files via web scraping
- Extracted metadata: homepage URLs, npm package names, GitHub repos
- **Risk:** Zero (read-only, no code execution)

---

## Phase 2: Source Code Acquisition Strategy

### Option A: GitHub Repository Cloning (RECOMMENDED - Safest)

**Approach:**
1. Parse each SKILL.md for GitHub URLs (`homepage: https://github.com/user/repo`)
2. Use `git clone --depth 1 --no-checkout` to clone without checking out files
3. Use `git archive` to extract files without triggering any hooks
4. Scan extracted source files

**Security Benefits:**
- ✅ No code execution (no postinstall scripts)
- ✅ No npm/pip package installation
- ✅ Git hooks never run
- ✅ Can inspect files without executing them
- ✅ Works in air-gapped Docker container

**Limitations:**
- Only works for skills with GitHub repos (~70-80% of skills)
- Misses proprietary/closed-source skills
- Misses skills published only to npm

**Risk Level:** 🟢 **LOW**

---

### Option B: npm Package Download (Higher Risk)

**Approach:**
1. Use `npm pack <package>` instead of `npm install`
2. Extract tarball without running scripts
3. Scan extracted source files

**Security Measures:**
```bash
# Download package tarball without installing
npm pack agent-security-scanner-mcp --dry-run=false

# Extract without running scripts
tar -xzf agent-security-scanner-mcp-*.tgz

# Scan the package/ directory
node index.js scan-project ./package/
```

**Security Benefits:**
- ✅ No postinstall scripts executed (npm pack skips lifecycle scripts)
- ✅ No dependencies installed
- ✅ Just downloads the package tarball

**Risks:**
- ⚠️ npm registry could be compromised
- ⚠️ Tarball extraction could trigger vulnerabilities (zip bombs, path traversal)
- ⚠️ Malicious package.json scripts could be present (but won't run)

**Risk Level:** 🟡 **MEDIUM**

---

### Option C: Hybrid Approach (BEST - Maximum Coverage)

**Strategy:**
1. **First pass:** Clone GitHub repos where available (70-80% of skills)
2. **Second pass:** Use `npm pack` for remaining skills without GitHub links
3. **Third pass:** Manual review of high-risk/popular skills

**Risk Level:** 🟡 **MEDIUM** (isolated environments required)

---

## Phase 3: Isolation Architecture

### Layer 1: Docker Container (Local Isolation)

**Dockerfile Updates:**
```dockerfile
# Add isolation features
RUN useradd -m -s /bin/bash scanner
USER scanner

# Disable network after setup (optional)
# Can block outbound connections via iptables

# Resource limits already in docker-compose.yml
# mem_limit: 4g
# cpus: 2
```

**Enhanced Security:**
- Read-only root filesystem where possible
- No privilege escalation
- AppArmor/SELinux profiles
- Network isolation after clone/download phase

---

### Layer 2: GCP VM (Maximum Isolation)

**VM Configuration:**
- **Machine Type:** e2-standard-4 (4 vCPU, 16GB RAM) for faster scanning
- **Disk:** 50GB (to accommodate source code)
- **Network:** VPC with egress firewall rules (block all except git/npm)
- **Snapshot:** Taken before scan starts (for forensics if compromised)
- **Auto-delete:** VM destroyed immediately after results uploaded

**Cost:** ~$0.30 for 2-3 hour scan

---

## Phase 4: Scanning Workflow

### Step-by-Step Process

```
1. Fetch skill metadata (already done)
   ↓
2. For each skill:
   ├── Extract GitHub URL from SKILL.md
   ├── If GitHub URL exists:
   │   ├── git clone --depth 1 --no-checkout <repo>
   │   ├── git archive HEAD | tar -x -C /tmp/skill-source
   │   └── Scan /tmp/skill-source
   ├── Else if npm package exists:
   │   ├── npm pack <package> --dry-run=false
   │   ├── tar -xzf package.tgz -C /tmp/skill-source
   │   └── Scan /tmp/skill-source
   └── Delete /tmp/skill-source
   ↓
3. Aggregate results
   ↓
4. Destroy container/VM
```

---

## Phase 5: Implementation Plan

### Files to Create

1. **`src/cli/scan-clawhub-full.js`**
   - Orchestrates GitHub + npm acquisition
   - Handles timeouts and errors gracefully
   - Implements cleanup after each skill

2. **`src/utils/github-clone.js`**
   - Safe git cloning with `--no-checkout`
   - Archive extraction
   - Handles private repos gracefully (skip them)

3. **`src/utils/npm-download.js`**
   - Safe npm pack downloading
   - Tarball extraction with size limits
   - Validates package.json without executing

4. **`Dockerfile.clawhub-full`**
   - Extended isolation features
   - Git + npm tools installed
   - Network policies configured

5. **`docker-compose.clawhub-full.yml`**
   - Mounts for source code download
   - Increased resource limits
   - Health checks

6. **`deploy-gcp-full-scan.sh`**
   - GCP VM with snapshot capability
   - Results upload to Cloud Storage
   - Automatic cleanup

---

## Phase 6: Risk Mitigation Checklist

### Before Running Scan

- [ ] Test on 10 known-safe skills first
- [ ] Verify Docker isolation works
- [ ] Test GCP VM auto-destroy
- [ ] Set up monitoring/alerts
- [ ] Prepare incident response plan

### During Scan

- [ ] Monitor resource usage (CPU, RAM, disk)
- [ ] Watch for unexpected network activity
- [ ] Check for filesystem changes outside /tmp
- [ ] Log all git/npm commands executed

### After Scan

- [ ] Verify results uploaded successfully
- [ ] Delete all downloaded source code
- [ ] Destroy Docker container
- [ ] Destroy GCP VM
- [ ] Review logs for anomalies

---

## Phase 7: Timeline & Effort

### Implementation: 2-3 hours
- Write GitHub cloning logic (30 min)
- Write npm pack logic (30 min)
- Update Docker/GCP scripts (30 min)
- Test on 10 skills (30 min)
- Debug and refine (30 min)

### Execution: 3-5 hours
- Download 415 skill sources (~2-3 hours)
- Scan 415 skills (~1-2 hours, parallel)
- Upload results and cleanup (~15 min)

### Total: 5-8 hours

---

## Phase 8: Expected Results

### Realistic Vulnerability Rates

Based on industry data:

- **Expected vulnerable skills:** 15-25% (60-100 skills)
- **Critical findings:** 5-10%
- **Common issues:**
  - Hardcoded secrets (API keys, passwords)
  - SQL injection vulnerabilities
  - Command injection
  - Path traversal
  - Insecure dependencies
  - Typosquatting in dependencies

### Comparison to Snyk's ToxicSkills Study

Their findings (VSCode marketplace):
- 10% of extensions had malware indicators
- 20% had security vulnerabilities
- 30% had quality/safety issues

We expect similar or slightly better rates for ClawHub (newer, smaller marketplace).

---

## Phase 9: Blog Post Angle

### Title Options

1. "We Scanned Every Skill on ClawHub — Here's What We Found"
2. "The State of Security in AI Agent Marketplaces"
3. "415 Skills, 60 Vulnerabilities: ClawHub Security Report"

### Key Narrative Points

1. **Documentation vs. Implementation**
   - First scan: SKILL.md files (98.6% clean)
   - Second scan: Actual source code (X% vulnerable)
   - Gap shows importance of deep scanning

2. **Comparison to Other Marketplaces**
   - VSCode: 30% issues (Snyk study)
   - NPM: 17% malicious (Socket study)
   - ClawHub: X% (our findings)

3. **Most Common Vulnerabilities**
   - Ranked list with examples
   - Real code snippets (anonymized)
   - Fix recommendations

4. **Call to Action**
   - Use ClawProof to scan before installing
   - Marketplace should add automated scanning
   - Developers should use security tools

---

## Phase 10: Decision Matrix

### Hybrid Approach Recommended

| Aspect | GitHub Clone | npm pack | Hybrid |
|--------|--------------|----------|--------|
| **Coverage** | 70-80% | 90-95% | 95%+ |
| **Safety** | 🟢 High | 🟡 Medium | 🟡 Medium |
| **Speed** | Fast | Medium | Medium |
| **Accuracy** | High | High | High |
| **Implementation** | Easy | Medium | Medium |

**Recommendation:** Hybrid approach for maximum coverage with acceptable risk in isolated environment.

---

## Phase 11: Immediate Next Steps

1. ✅ **Approve this plan**
2. ⏳ **Implement GitHub cloning logic** (30 min)
3. ⏳ **Implement npm pack logic** (30 min)
4. ⏳ **Test on 10 known-safe skills** (30 min)
5. ⏳ **Run full scan in GCP VM** (3-5 hours)
6. ⏳ **Analyze results and write blog post** (2 hours)

**Total time to publication:** 1-2 days

---

## Security Incident Response

### If Compromise Suspected

1. **Immediate Actions:**
   - Kill Docker container: `docker stop clawhub-full-scan`
   - Delete GCP VM: `gcloud compute instances delete`
   - Disconnect host from network
   - Take filesystem snapshot for analysis

2. **Investigation:**
   - Review logs for executed commands
   - Check for unauthorized network connections
   - Scan host system with antivirus
   - Review ~/.openclaw/ for modifications

3. **Recovery:**
   - Restore from backup if needed
   - Rotate API keys and credentials
   - Document incident
   - Improve isolation for next run

---

## Conclusion

**This plan provides:**
- ✅ Safe scanning of actual implementation code
- ✅ Multi-layer isolation (Docker + GCP)
- ✅ No code execution (git archive + npm pack)
- ✅ Automatic cleanup
- ✅ Incident response procedures
- ✅ Realistic timeline (1-2 days)

**Risk Level:** 🟡 **MEDIUM** with proper isolation
**Reward:** High-quality security research data for blog post
**Recommended:** Proceed with hybrid approach in GCP VM

---

**Ready to implement?** Let me know and I'll start building the GitHub cloning and npm pack logic.
