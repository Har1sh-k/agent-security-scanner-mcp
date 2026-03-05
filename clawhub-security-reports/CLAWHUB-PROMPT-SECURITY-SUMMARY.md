# ClawHub Prompt Security Analysis Report

**Date:** 2026-03-04
**Scanner Version:** v3.7.0 (Prompt Injection Detection)
**Skills Analyzed:** 16532
**Successful Scans:** 13431
**Failed Scans:** 3101

---

## Executive Summary

This report presents the first comprehensive prompt security analysis of the ClawHub ecosystem, focusing on the 94% of skills that are prompt-based rather than code-based.

### Key Findings:

1. **5769 skills (43.0%) contain security issues**
2. **53427 total prompt injection patterns detected**
3. **Grade F skills: 3932** - Critical security threats
4. **Grade A skills: 7662** - Safe to use

---

## Grade Distribution

| Grade | Count | Percentage | Risk Level |
|-------|-------|------------|------------|
| A | 7662 | 57.0% | Safe |
| B | 341 | 2.5% | Low risk |
| C | 1084 | 8.1% | Medium risk |
| D | 412 | 3.1% | High risk |
| F | 3932 | 29.3% | Critical - DO NOT INSTALL |
| ERROR | 3101 | 18.8% | Scan failed |

---

## Most Dangerous Skills (Top 20)

### 1. joelazar/kagi-enrich - Grade F
- **Findings:** 1326
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 2. joelazar/kagi-fastgpt - Grade F
- **Findings:** 1118
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 3. spyfree/bazi-analysis - Grade F
- **Findings:** 670
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 4. foxleoly/adguard-home - Grade F
- **Findings:** 484
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 5. foxleoly/adguard-test - Grade F
- **Findings:** 483
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 6. diegopetrucci/odds-checker-api - Grade F
- **Findings:** 442
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 7. cpppppp7/fluxa-agent-wallet - Grade F
- **Findings:** 349
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 8. aipoch-ai/survival-analysis-km - Grade F
- **Findings:** 322
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 9. samuelhe52/icloud-caldav - Grade F
- **Findings:** 311
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 10. daiwk/model-resource-profiler - Grade F
- **Findings:** 294
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 11. shreyjindal81/clawcall-ai - Grade F
- **Findings:** 273
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 12. batsirai/aeo-system - Grade F
- **Findings:** 264
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 13. 402goose/compact-state - Grade F
- **Findings:** 255
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 14. noreplyboter/better-polymarket - Grade F
- **Findings:** 250
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 15. noreplyboter/polymarket-all-in-one - Grade F
- **Findings:** 250
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 16. frankdilo/typefully-social-media - Grade F
- **Findings:** 244
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 17. sanky369/keywords-everywhere - Grade F
- **Findings:** 220
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 18. cpppppp7/fluxa-x402-payment - Grade F
- **Findings:** 211
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 19. liuhean2021/oss-upload-online-access - Grade F
- **Findings:** 206
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk

### 20. thesethrose/apple-docs - Grade F
- **Findings:** 194
- **Recommendation:** DO NOT INSTALL - This skill contains critical security threats that pose immediate risk


---

## Attack Categories Detected

| Category | Occurrences | Affected Skills | Severity |
|----------|-------------|-----------------|----------|
| use-escapexml | 11767 | 1068 | MEDIUM |
| detect-disable-mustache-escape | 5098 | 701 | MEDIUM |
| detect-non-literal-require | 1679 | 550 | MEDIUM |
| openclaw_attack | 1441 | 1330 | CRITICAL |
| template-explicit-unescape | 1222 | 613 | MEDIUM |
| avoid-raw | 1165 | 327 | MEDIUM |
| generic-api-key | 761 | 424 | MEDIUM |
| code_execution | 756 | 479 | CRITICAL |
| dynamic-urllib-use-detected | 682 | 485 | MEDIUM |
| system-manipulation | 682 | 576 | CRITICAL |
| prompt-injection-content | 681 | 585 | CRITICAL |
| exfiltration | 678 | 609 | CRITICAL |
| prompt-injection-privilege | 678 | 678 | HIGH |
| razor-use-of-htmlstring | 615 | 234 | MEDIUM |
| python.lang.security.audit.hardcoded-api-key | 585 | 427 | HIGH |
| mysql-sqli | 552 | 31 | MEDIUM |
| psycopg-sqli | 552 | 31 | MEDIUM |
| pymssql-sqli | 552 | 31 | MEDIUM |
| pymysql-sqli | 552 | 31 | MEDIUM |
| sqlalchemy-sqli | 552 | 31 | MEDIUM |
| obfuscation | 513 | 513 | HIGH |
| express-xml2json-xxe | 491 | 95 | HIGH |
| express-vm-injection | 447 | 65 | HIGH |
| request-host-used | 429 | 95 | MEDIUM |
| express-phantom-injection | 426 | 66 | HIGH |
| express-puppeteer-injection | 426 | 66 | HIGH |
| express-wkhtmltoimage-injection | 426 | 66 | HIGH |
| x-frame-options-misconfiguration | 426 | 66 | MEDIUM |
| express-open-redirect | 426 | 66 | MEDIUM |
| res-render-injection | 426 | 66 | MEDIUM |
| hallucinated_package | 407 | 330 | CRITICAL |
| detect-child-process | 383 | 170 | MEDIUM |
| eval-detected | 322 | 241 | MEDIUM |
| dangerous-asyncio-shell | 290 | 129 | MEDIUM |
| prompt-injection-encoded | 265 | 265 | CRITICAL |
| express-expat-xxe | 263 | 60 | HIGH |
| autonomous_harm | 252 | 251 | MEDIUM |
| dangerous-asyncio-exec | 241 | 27 | HIGH |
| unsafe-formatstring | 226 | 105 | MEDIUM |
| dangerous-spawn-shell | 221 | 132 | MEDIUM |
| compile-detected | 219 | 82 | MEDIUM |
| prompt-injection-output | 206 | 205 | CRITICAL |
| cors-misconfiguration | 197 | 54 | MEDIUM |
| dangerous-system-call-audit | 179 | 124 | HIGH |
| dangerous-system-call | 179 | 124 | MEDIUM |
| avoid-pickle | 162 | 141 | MEDIUM |
| insecure-deserialization | 162 | 141 | HIGH |
| cancelable-context-not-systematically-cancelled | 162 | 9 | MEDIUM |
| javascript.llm.security.prompt-injection.anthropic-unsafe | 157 | 95 | HIGH |
| insecure-createnodesfrommarkup | 157 | 95 | MEDIUM |
| insecure-document-method | 157 | 95 | HIGH |
| tofastproperties-code-execution | 157 | 95 | MEDIUM |
| exec-detected | 151 | 132 | MEDIUM |
| insecure-hash-algorithm-md5 | 150 | 131 | MEDIUM |
| unquoted-csv-writer | 149 | 130 | HIGH |
| python.llm.security.prompt-injection.llamaindex-unsafe-query | 146 | 123 | HIGH |
| system-wildcard-detected | 145 | 77 | MEDIUM |
| httpsconnection-detected | 145 | 125 | MEDIUM |
| flask-sql-injection-execute | 144 | 19 | HIGH |
| debug-template-tag | 143 | 41 | MEDIUM |
| python.llm.security.prompt-injection.anthropic-unsafe-fstring | 141 | 123 | HIGH |
| unverified-ssl-context | 141 | 124 | HIGH |
| insecure-hash-algorithm-sha1 | 138 | 121 | MEDIUM |
| avoid_using_app_run_directly | 137 | 120 | MEDIUM |
| insecure-uuid-version | 136 | 119 | MEDIUM |
| python.llm.security.prompt-injection.ollama-unsafe | 135 | 118 | HIGH |
| insecure-cipher-algorithm-blowfish | 135 | 118 | MEDIUM |
| insecure-cipher-algorithm-des | 135 | 118 | MEDIUM |
| insecure-cipher-algorithm-rc2 | 135 | 118 | MEDIUM |
| insecure-cipher-algorithm-rc4 | 135 | 118 | MEDIUM |
| insecure-cipher-algorithm-xor | 135 | 118 | MEDIUM |
| insecure-hash-algorithm-md2 | 135 | 118 | MEDIUM |
| insecure-hash-algorithm-md4 | 135 | 118 | MEDIUM |
| multiprocessing-recv | 135 | 118 | MEDIUM |
| mako-templates-detected | 135 | 118 | MEDIUM |
| marshal-usage | 135 | 118 | MEDIUM |
| sha224-hash | 135 | 118 | MEDIUM |
| ssl-wrap-socket-is-deprecated | 135 | 118 | MEDIUM |
| telnetlib | 135 | 118 | MEDIUM |
| avoid-pyyaml-load | 135 | 118 | HIGH |
| avoid-cPickle | 135 | 118 | MEDIUM |
| avoid-dill | 135 | 118 | MEDIUM |
| avoid-shelve | 135 | 118 | MEDIUM |
| listen-eval | 135 | 118 | MEDIUM |
| http-not-https-connection | 135 | 118 | HIGH |
| insecure-openerdirector-open-ftp | 135 | 118 | MEDIUM |
| insecure-openerdirector-open | 135 | 118 | MEDIUM |
| insecure-urlopener-open-ftp | 135 | 118 | MEDIUM |
| insecure-urlopener-open | 135 | 118 | MEDIUM |
| insecure-urlopener-retrieve-ftp | 135 | 118 | MEDIUM |
| insecure-urlopener-retrieve | 135 | 118 | MEDIUM |
| missing-autoescape-disabled | 135 | 118 | MEDIUM |
| render-template-string | 135 | 118 | MEDIUM |
| direct-use-of-jinja2 | 135 | 118 | MEDIUM |
| explicit-unescape-with-markup | 135 | 118 | MEDIUM |
| make-response-with-unknown-content | 135 | 118 | MEDIUM |
| django-using-request-post-after-is-valid | 135 | 118 | MEDIUM |
| avoid-mark-safe | 135 | 118 | MEDIUM |
| avoid-raw-sql | 135 | 118 | MEDIUM |
| django-secure-set-cookie | 135 | 118 | MEDIUM |
| html-safe | 135 | 118 | MEDIUM |
| insecure-cipher-algorithm-idea | 135 | 118 | MEDIUM |
| insecure-cipher-mode-ecb | 135 | 118 | MEDIUM |
| ftplib | 135 | 118 | MEDIUM |
| use-ftp-tls | 135 | 118 | MEDIUM |
| autoescape-disabled | 135 | 118 | MEDIUM |
| directly-returned-format-string | 135 | 118 | MEDIUM |
| avoid-sqlalchemy-text | 134 | 112 | HIGH |
| insecure-random | 133 | 84 | MEDIUM |
| potential-dos-via-decompression-bomb | 127 | 9 | MEDIUM |
| reflect-makefunc | 127 | 9 | HIGH |
| use-of-unsafe-block | 127 | 9 | MEDIUM |
| avoid-ssh-insecure-ignore-host-key | 127 | 9 | MEDIUM |
| use-of-rc4 | 127 | 9 | MEDIUM |
| pprof-debug-exposure | 127 | 9 | MEDIUM |
| unsafe-template-type | 127 | 9 | MEDIUM |
| grpc-server-insecure-connection | 127 | 9 | HIGH |
| use-strings-join-path | 127 | 9 | HIGH |
| os-error-is-timeout | 127 | 9 | HIGH |
| use-jstl-escaping | 126 | 37 | MEDIUM |
| jwt-python-exposed-data | 116 | 109 | MEDIUM |
| dangerous-asyncio-shell-audit | 114 | 107 | HIGH |
| no-fprintf-to-responsewriter | 114 | 7 | MEDIUM |
| insufficient-dsa-key-size | 113 | 106 | MEDIUM |
| insufficient-rsa-key-size | 113 | 106 | MEDIUM |
| bad-nil-guard | 112 | 7 | HIGH |
| subprocess-list-passed-as-string | 110 | 93 | MEDIUM |
| insecure-cipher-algorithm-arc4 | 95 | 93 | MEDIUM |
| detect-eval-with-expression | 87 | 42 | MEDIUM |
| detect-non-literal-regexp | 86 | 41 | MEDIUM |
| vm-script-code-injection | 86 | 41 | MEDIUM |
| vm-sourcetextmodule-code-injection | 86 | 41 | MEDIUM |
| malicious-injection | 77 | 76 | CRITICAL |
| agent-manipulation | 76 | 76 | HIGH |
| prompt-injection-jailbreak | 70 | 60 | HIGH |
| deprecated-ioutil-nopcloser | 67 | 7 | HIGH |
| deprecated-ioutil-readall | 67 | 7 | HIGH |
| deprecated-ioutil-readdir | 67 | 7 | HIGH |
| deprecated-ioutil-readfile | 67 | 7 | HIGH |
| odd-bits-leadingzeros | 67 | 7 | HIGH |
| os-error-is-exist | 67 | 7 | HIGH |
| os-error-is-not-exist | 67 | 7 | HIGH |
| os-error-is-permission | 67 | 7 | HIGH |
| service_attack | 63 | 63 | MEDIUM |
| python.llm.security.prompt-injection.openai-unsafe-format | 63 | 43 | HIGH |
| python.lang.security.audit.hardcoded-password | 58 | 42 | HIGH |
| data_exfiltration | 58 | 58 | MEDIUM |
| prompt-injection-context | 58 | 58 | HIGH |
| python.flask.security.secret-key-hardcoded | 58 | 23 | HIGH |
| credential_theft | 53 | 53 | MEDIUM |
| detect-buffer-noassert | 49 | 28 | MEDIUM |
| apollo-axios-ssrf | 42 | 25 | MEDIUM |
| dynamic-httptrace-clienttrace | 39 | 4 | MEDIUM |
| use-tls | 39 | 4 | MEDIUM |
| no-io-writestring-to-responsewriter | 39 | 4 | MEDIUM |
| anonymous-struct-args | 39 | 4 | HIGH |
| deprecated-ioutil-tempdir | 39 | 4 | HIGH |
| deprecated-ioutil-tempfile | 39 | 4 | HIGH |
| exfil_endpoint | 37 | 37 | CRITICAL |
| var-in-href | 33 | 21 | MEDIUM |
| template-href-var | 33 | 21 | MEDIUM |
| phantom-injection | 31 | 19 | MEDIUM |
| python.lang.security.ssl.ssl-verify-disabled | 26 | 21 | HIGH |
| detect-insecure-websocket | 24 | 16 | HIGH |
| dns_exfiltration | 24 | 24 | CRITICAL |
| social-engineering | 23 | 23 | HIGH |
| dangerous-subprocess-use | 22 | 17 | HIGH |
| javascript.lang.security.ssl.reject-unauthorized-false | 22 | 16 | HIGH |
| open-redirect | 22 | 16 | MEDIUM |
| reflected-data-httpresponse | 22 | 16 | MEDIUM |
| reflected-data-httpresponsebadrequest | 22 | 16 | MEDIUM |
| request-data-fileresponse | 22 | 16 | MEDIUM |
| request-data-write | 22 | 16 | MEDIUM |
| command-injection-os-system | 22 | 16 | HIGH |
| path-traversal-open | 22 | 16 | MEDIUM |
| sql-injection-using-rawsql | 22 | 16 | MEDIUM |
| sql-injection-db-cursor-execute | 22 | 16 | MEDIUM |
| sql-injection-using-raw | 22 | 16 | MEDIUM |
| ssrf-injection-requests | 22 | 16 | HIGH |
| ssrf-injection-urllib | 22 | 16 | HIGH |
| generic.secrets.security.hardcoded-api-key | 20 | 20 | MEDIUM |
| hashicorp-tf-password | 20 | 19 | MEDIUM |
| insecure-hash-md5 | 16 | 15 | MEDIUM |
| info_stealer | 15 | 15 | CRITICAL |
| use-defusedcsv | 14 | 14 | MEDIUM |
| innerHTML | 14 | 6 | MEDIUM |
| deprecated-ioutil-writefile | 14 | 5 | HIGH |
| insecure-use-string-copy-fn | 13 | 4 | MEDIUM |
| screen_capture | 10 | 10 | HIGH |
| weak-random | 10 | 4 | MEDIUM |
| prompt-injection-extraction | 9 | 9 | CRITICAL |
| campaign | 8 | 8 | CRITICAL |
| unwrap-usage | 8 | 2 | MEDIUM |
| detect-angular-element-methods | 8 | 2 | MEDIUM |
| var-in-script-tag | 7 | 7 | MEDIUM |
| javascript.lang.security.audit.hardcoded-secret | 6 | 5 | HIGH |
| prompt-injection-delimiter | 6 | 6 | CRITICAL |
| puppeteer-exposed-chrome-devtools | 6 | 4 | MEDIUM |
| playwright-exposed-chrome-devtools | 6 | 4 | MEDIUM |
| sql-injection-db-cursor | 5 | 3 | HIGH |
| sql-injection-using-sqlalchemy | 5 | 3 | HIGH |
| ssl-verify-disabled | 5 | 1 | MEDIUM |
| detected-google-api-key | 4 | 4 | HIGH |
| google-maps-apikeyleak | 4 | 4 | MEDIUM |
| keylogger | 3 | 3 | HIGH |
| python.django.security.secret-key-hardcoded | 3 | 3 | HIGH |
| prompt_scan_error | 3 | 3 | CRITICAL |
| github-pat | 3 | 3 | MEDIUM |
| crypto_miner | 3 | 3 | CRITICAL |
| javascript.express.security.open-redirect | 3 | 1 | MEDIUM |
| insecure-hash-sha1 | 3 | 3 | MEDIUM |
| gcp-api-key | 3 | 3 | MEDIUM |
| detected-google-cloud-api-key | 3 | 3 | HIGH |
| messaging_abuse | 2 | 2 | MEDIUM |
| python.django.security.debug-enabled | 2 | 1 | HIGH |
| reverse_shell | 2 | 1 | CRITICAL |
| insecure-memset | 2 | 2 | MEDIUM |
| insecure-use-gets-fn | 2 | 2 | HIGH |
| insecure-use-scanf-fn | 2 | 2 | MEDIUM |
| insecure-use-strcat-fn | 2 | 2 | MEDIUM |
| insecure-use-strtok-fn | 2 | 2 | MEDIUM |
| nan-injection | 1 | 1 | HIGH |
| detected-pgp-private-key-block | 1 | 1 | HIGH |
| php.lang.security.audit.xxe | 1 | 1 | HIGH |
| php.lang.security.audit.session-fixation | 1 | 1 | MEDIUM |
| wp-ajax-no-auth-and-auth-hooks-audit | 1 | 1 | MEDIUM |
| wp-code-execution-audit | 1 | 1 | MEDIUM |
| wp-command-execution-audit | 1 | 1 | MEDIUM |
| wp-file-download-audit | 1 | 1 | MEDIUM |
| wp-file-inclusion-audit | 1 | 1 | MEDIUM |
| wp-file-manipulation-audit | 1 | 1 | MEDIUM |
| wp-open-redirect-audit | 1 | 1 | MEDIUM |
| wp-php-object-injection-audit | 1 | 1 | MEDIUM |
| eval-use | 1 | 1 | HIGH |
| mb-ereg-replace-eval | 1 | 1 | HIGH |
| php-permissive-cors | 1 | 1 | MEDIUM |
| phpinfo-use | 1 | 1 | HIGH |
| unlink-use | 1 | 1 | MEDIUM |
| unserialize-use | 1 | 1 | MEDIUM |
| weak-crypto | 1 | 1 | HIGH |
| assert-use-audit | 1 | 1 | HIGH |
| openssl-decrypt-validate | 1 | 1 | MEDIUM |
| doctrine-dbal-dangerous-query | 1 | 1 | MEDIUM |
| wp-ssrf-audit | 1 | 1 | MEDIUM |
| doctrine-orm-dangerous-query | 1 | 1 | MEDIUM |
| aws-access-token | 1 | 1 | MEDIUM |
| detected-aws-access-key-id-value | 1 | 1 | HIGH |
| insecure-object-assign | 1 | 1 | MEDIUM |
| prompt-injection-multi-turn | 1 | 1 | HIGH |
| jwt | 1 | 1 | MEDIUM |
| detected-jwt-token | 1 | 1 | HIGH |
| stripe-access-token | 1 | 1 | MEDIUM |
| detected-telegram-bot-api-key | 1 | 1 | HIGH |
| private-key | 1 | 1 | MEDIUM |
| express-data-exfiltration | 1 | 1 | MEDIUM |
| express-sandbox-code-injection | 1 | 1 | HIGH |
| express-vm2-injection | 1 | 1 | MEDIUM |

---

## Comparison to Code Security Scan

| Metric | Code Scan (v6) | Prompt Scan (Current) |
|--------|----------------|----------------------|
| Total Skills | 415 | 16532 |
| Skills with Code | 14 (3.4%) | 0 (prompt-only) |
| Successful Scans | 6 (42.9% of code) | 13431 (81.2%) |
| Vulnerabilities Found | 0 | 53427 |
| Grade F Skills | 0 | 3932 |

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

See `CLAWHUB-PROMPT-SECURITY-REPORT.json` for complete scan results with all findings.

---

**Report Generated:** 2026-03-04T22:56:23.446Z
**Scanner:** agent-security-scanner-mcp v3.7.0
**Contact:** https://github.com/dheerajreddy-ui/agent-security-layer
