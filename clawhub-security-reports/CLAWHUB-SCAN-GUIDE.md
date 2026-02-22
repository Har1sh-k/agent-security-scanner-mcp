# ClawHub Security Scanner - Isolated Deployment Guide

This guide provides **safe, isolated** methods to scan all ClawHub skills for security vulnerabilities.

## ⚠️ Security Considerations

Scanning ClawHub skills involves installing and potentially executing untrusted code. We provide two isolated approaches:

1. **Docker Container** (local, fully isolated)
2. **Google Cloud VM** (remote, disposable)

---

## Option 1: Docker Isolated Scan (RECOMMENDED)

### Prerequisites
- Docker installed ([install guide](https://docs.docker.com/get-docker/))
- Docker Compose installed
- 4GB RAM available
- 20GB disk space

### Steps

#### 1. Build the Docker image
```bash
docker-compose -f docker-compose.clawhub.yml build
```

#### 2. Run the scan
```bash
docker-compose -f docker-compose.clawhub.yml up
```

#### 3. Monitor progress
```bash
docker logs -f clawhub-security-scan
```

#### 4. Collect results
Results are automatically saved to `./clawhub-scan/` on your host:
```bash
ls -lh clawhub-scan/
# results.json - Raw scan data
# report.json  - Summary statistics
```

#### 5. Cleanup
```bash
docker-compose -f docker-compose.clawhub.yml down
docker rmi $(docker images -q -f "dangling=true")
```

### Security Features
- ✅ Isolated container environment
- ✅ Non-root user execution
- ✅ Resource limits (4GB RAM, 2 CPUs)
- ✅ Read-only filesystem where possible
- ✅ No host network access
- ✅ Disposable - delete after scan

### Estimated Time
- Build: 5-10 minutes
- Scan: 1-2 hours (395 skills)
- Total: ~2 hours

---

## Option 2: Google Cloud VM (SAFEST)

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed ([install guide](https://cloud.google.com/sdk/docs/install))
- Active GCP project with billing enabled

### Steps

#### 1. Set your GCP project
```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_ZONE="us-central1-a"  # Optional: change region
```

#### 2. Deploy the scanner VM
```bash
./deploy-gcp-scanner.sh
```

This will:
- Create an e2-standard-2 VM (2 vCPU, 8GB RAM)
- Install all dependencies
- Clone the repository
- Run the scan automatically

#### 3. Monitor progress (optional)
```bash
VM_NAME="clawhub-scanner-XXXXXX"  # From deploy script output
gcloud compute ssh $VM_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT_ID --command='tail -f /root/scan-output.log'
```

#### 4. Download results
```bash
gcloud compute scp $VM_NAME:/root/scanner/clawhub-scan/results.json ./clawhub-scan/ --zone=$GCP_ZONE --project=$GCP_PROJECT_ID
gcloud compute scp $VM_NAME:/root/scanner/clawhub-scan/report.json ./clawhub-scan/ --zone=$GCP_ZONE --project=$GCP_PROJECT_ID
```

#### 5. Delete the VM (IMPORTANT)
```bash
gcloud compute instances delete $VM_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT_ID --quiet
```

### Security Features
- ✅ Completely isolated from your machine
- ✅ Disposable VM (delete after scan)
- ✅ No persistent access to your environment
- ✅ Logs available for audit
- ✅ Can snapshot for forensic analysis

### Cost Estimate
- VM runtime: ~$0.10/hour
- Total cost for 2-hour scan: **~$0.20**

### Estimated Time
- VM creation: 2-3 minutes
- Scan: 1-2 hours
- Total: ~2 hours

---

## Understanding the Results

### results.json
Complete scan data for each skill:
```json
{
  "slug": "skill-name",
  "grade": "A-F",
  "findings": [...],
  "findingsCount": 3,
  "recommendation": "..."
}
```

### report.json
Aggregate statistics:
```json
{
  "summary": {
    "totalSkills": 395,
    "vulnerableSkills": 145,
    "vulnerabilityRate": "36.7%",
    "gradeDistribution": {
      "A": 250,
      "B": 0,
      "C": 50,
      "D": 60,
      "F": 35
    },
    "totalFindings": {
      "critical": 45,
      "warning": 120,
      "info": 80
    }
  },
  "topIssues": [
    { "rule": "prompt-injection", "count": 23 },
    ...
  ]
}
```

---

## Troubleshooting

### Docker build fails
```bash
# Clean docker cache
docker system prune -a
docker-compose -f docker-compose.clawhub.yml build --no-cache
```

### GCP authentication errors
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Scan timeout
The scan has a 120s timeout per skill. If many skills time out:
- Increase resources in docker-compose.yml
- Use larger GCP machine type: `e2-standard-4`

### Insufficient permissions
For GCP, ensure you have:
```bash
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="user:your-email@example.com" \
  --role="roles/compute.instanceAdmin.v1"
```

---

## Next Steps

After scanning:

1. **Analyze Results**
   ```bash
   cat clawhub-scan/report.json | jq '.summary'
   ```

2. **Generate Blog Post**
   - Use findings to write "We Scanned Every Skill on ClawHub"
   - Include grade distribution, top vulnerabilities
   - Compare to Snyk's ToxicSkills study

3. **Create Dashboard**
   - Build static HTML site with per-skill grades
   - Make searchable/filterable
   - Publish to GitHub Pages

4. **Share Results**
   - Post to Hacker News, Reddit, OpenClaw Discord
   - Tag ClawHub, OpenClaw maintainers
   - Offer to help skill authors fix issues

---

## Safety Notes

### What We're Protecting Against
- ❌ Malicious install scripts
- ❌ Crypto miners
- ❌ Data exfiltration
- ❌ Credential theft
- ❌ System compromise

### How Isolation Helps
- ✅ Docker: Container deleted after scan
- ✅ GCP: VM destroyed after scan
- ✅ No access to your personal files
- ✅ No access to your credentials
- ✅ Network can be disabled after setup

### If You Suspect Compromise
1. Stop the scan immediately
2. Delete the container/VM
3. Check for unusual network activity
4. Review the skill that was being scanned
5. Report to ClawHub moderators

---

## License

This scanner is open source (MIT). Results are yours to publish with attribution.

## Support

- GitHub Issues: https://github.com/sinewaveai/agent-security-scanner-mcp/issues
- Email: [email protected]
