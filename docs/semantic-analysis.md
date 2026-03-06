# Semantic Code Analysis

## Overview

The Semantic Analysis Layer provides deep logic-level vulnerability detection that goes beyond syntax-based (AST) and pattern-based (regex) approaches. It uses **Code Property Graphs (CPG)** combining Control Flow Graph (CFG) and Data Flow Graph (DFG) to detect vulnerabilities that require understanding execution paths and data dependencies.

## Architecture

```
Source Code
    ↓
AST (Abstract Syntax Tree)
    ↓
CFG (Control Flow Graph) ──┐
    ↓                        ├─→ CPG (Code Property Graph)
DFG (Data Flow Graph) ──────┘
    ↓
Pattern Matching
    ↓
Security Findings
```

### Components

1. **Control Flow Graph (CFG)**
   - Represents all possible execution paths through the code
   - Nodes: statements, conditions, loops, function calls
   - Edges: sequential execution, branches, returns, exceptions

2. **Data Flow Graph (DFG)**
   - Tracks how data flows through the program
   - Reaching definitions analysis
   - Live variable analysis
   - Use-def and def-use chains

3. **Code Property Graph (CPG)**
   - Combines CFG and DFG into unified graph
   - Enables complex queries spanning control and data flow
   - Foundation for pattern matching

4. **Pattern Matcher**
   - Detects security anti-patterns in CPG
   - 50+ semantic security rules
   - High-confidence, low-false-positive detection

## What It Detects

### Logic-Level Vulnerabilities

| Vulnerability | Description | CWE | Severity |
|--------------|-------------|-----|----------|
| **Missing Auth Checks** | Sensitive operations without authentication | CWE-306 | ERROR |
| **Missing Authz Checks** | Data access without authorization (IDOR) | CWE-639 | ERROR |
| **Race Conditions** | Concurrent access without synchronization | CWE-362 | WARNING |
| **TOCTOU** | Time-of-check-time-of-use vulnerabilities | CWE-367 | ERROR |
| **Logic Contradictions** | Impossible conditions, unreachable paths | CWE-570 | WARNING |
| **Use-After-Free** | Memory used after deallocation (C/C++) | CWE-416 | ERROR |
| **Double Free** | Memory freed twice (C/C++) | CWE-415 | ERROR |
| **Null Dereference** | Accessing null/undefined values | CWE-476 | WARNING |
| **Dead Stores** | Assignments never used | CWE-563 | INFO |
| **Unreachable Code** | Code that never executes | CWE-561 | WARNING |

### Advanced Patterns

- **Missing Bounds Checks** - Array access without validation
- **Unvalidated Redirects** - User-controlled redirect targets
- **Path Traversal** - File paths from user input
- **SSRF** - Server-side request forgery
- **XXE** - XML external entity attacks
- **LDAP/XPath Injection** - Injection in query languages
- **Insecure Deserialization** - Deserializing untrusted data
- **Weak Crypto** - Weak algorithms or parameters
- **Missing CSRF Protection** - State changes without tokens
- **Session Fixation** - Session not regenerated after login
- **Timing Attacks** - Non-constant-time secret comparison

## Usage

### Enable Semantic Analysis

Semantic analysis is **enabled by default** when available. To explicitly control:

```javascript
// Enable (default)
scan_security({ file_path: "app.js", enable_semantic: true })

// Disable
scan_security({ file_path: "app.js", enable_semantic: false })

// Semantic-only mode
scan_security({ file_path: "app.js", engine: "semantic" })

// All engines (AST + Taint + Semantic + Regex)
scan_security({ file_path: "app.js", engine: "all" })
```

### Configuration

Add to `.scannerrc.yaml`:

```yaml
version: 1

# Enable/disable semantic analysis
engines:
  semantic: true        # Enable CPG-based analysis
  ast: true             # Tree-sitter AST
  taint: true           # Taint tracking
  regex: true           # Regex fallback

# Semantic analysis options
semantic:
  max_path_depth: 100   # Max CFG path length to explore
  detect_unreachable: true
  detect_auth_bypass: true
  detect_race_conditions: true
  detect_toctou: true
```

## How It Works

### 1. Control Flow Graph Construction

```javascript
// Input code
if (user.isAdmin) {
  deleteDatabase();
} else {
  showError();
}

// CFG nodes
entry → condition(user.isAdmin) → [true_branch → deleteDatabase() → merge]
                                  [false_branch → showError() → merge]
merge → exit
```

### 2. Data Flow Analysis

```javascript
// Input code
let x = getUserInput();
db.query(x);

// DFG analysis
x: definition at line 1 (source: getUserInput)
   use at line 2 (sink: db.query)
   → FINDING: SQL injection (untainted user input flows to SQL sink)
```

### 3. Pattern Matching

```javascript
// TOCTOU Detection
if (fs.existsSync(file)) {  // Check
  fs.readFileSync(file);     // Use
}
// → FINDING: File state can change between check and use
```

## Examples

### Missing Authentication

**Vulnerable:**
```javascript
app.delete('/users/:id', (req, res) => {
  // No auth check!
  db.users.delete(req.params.id);
  res.send('Deleted');
});
```

**Finding:**
```json
{
  "ruleId": "semantic.missing-auth-check",
  "message": "Sensitive operation 'db.delete' executed without authentication check",
  "severity": "error",
  "confidence": "medium",
  "category": "auth-bypass"
}
```

**Fixed:**
```javascript
app.delete('/users/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).send('Forbidden');
  }
  db.users.delete(req.params.id);
  res.send('Deleted');
});
```

### TOCTOU Vulnerability

**Vulnerable:**
```python
if os.path.exists(filename):
    # Attacker can replace file here!
    with open(filename) as f:
        data = f.read()
```

**Finding:**
```json
{
  "ruleId": "semantic.toctou",
  "message": "TOCTOU vulnerability - file state may change between check and use",
  "severity": "error",
  "confidence": "medium",
  "category": "race-condition"
}
```

**Fixed:**
```python
try:
    with open(filename) as f:
        data = f.read()
except FileNotFoundError:
    handle_missing_file()
```

### Logic Contradiction

**Vulnerable:**
```javascript
if (x > 0) {
  if (x <= 0) {  // Impossible!
    doSomething();
  }
}
```

**Finding:**
```json
{
  "ruleId": "semantic.logic-contradiction",
  "message": "Logic contradiction detected: condition 'x <= 0' conflicts with earlier condition 'x > 0'",
  "severity": "warning",
  "confidence": "high"
}
```

### Dead Store

**Vulnerable:**
```go
func process() {
    x := 42  // Never used!
    return 0
}
```

**Finding:**
```json
{
  "ruleId": "semantic.dead-store",
  "message": "Dead store: assignment to variable 'x' is never used",
  "severity": "info",
  "confidence": "high"
}
```

## Performance

Semantic analysis adds **~100-300ms** per file (depends on code complexity):

| File Size | AST Only | AST + Semantic | Overhead |
|-----------|----------|----------------|----------|
| 100 LOC   | 50ms     | 120ms          | +70ms    |
| 500 LOC   | 150ms    | 350ms          | +200ms   |
| 1000 LOC  | 300ms    | 650ms          | +350ms   |

### Optimizations

- **Lazy evaluation** - Only compute CFG/DFG when patterns need them
- **Path depth limits** - Cap CFG path exploration at 100 nodes
- **Smart caching** - Cache parse trees and CFG/DFG across scans
- **Incremental analysis** - Only re-analyze changed functions

## Limitations

### What Semantic Analysis Can't Do

1. **Inter-procedural tracking** - Currently limited to single functions
   - ❌ Can't track auth checks across function boundaries
   - ✅ Detects missing auth in same function as sensitive op

2. **Dynamic behavior** - Static analysis only
   - ❌ Can't detect runtime-only vulnerabilities
   - ✅ Detects logic issues visible in code structure

3. **Complex data structures** - Simplified alias analysis
   - ❌ Can't track object property mutations
   - ✅ Tracks simple variable assignments

4. **Cross-file analysis** - Single-file scope
   - ❌ Can't track imports from other files
   - ✅ Use cross-file taint analysis for that

### False Positive Sources

1. **Auth pattern recognition**
   - May miss non-standard auth patterns
   - Heuristic: looks for `isAuthenticated`, `checkAuth`, `req.user`

2. **Race condition detection**
   - Conservative heuristic based on variable names
   - May flag non-shared state as concurrent access

3. **TOCTOU detection**
   - Simplified file path matching
   - May miss complex path constructions

## Comparison with Other Engines

| Capability | Regex | AST | Taint | Semantic |
|-----------|-------|-----|-------|----------|
| **Pattern matching** | ✅ | ✅ | ✅ | ✅ |
| **Syntax-aware** | ❌ | ✅ | ✅ | ✅ |
| **Data flow** | ❌ | ❌ | ✅ | ✅ |
| **Control flow** | ❌ | ❌ | ❌ | ✅ |
| **Unreachable code** | ❌ | ❌ | ❌ | ✅ |
| **Logic contradictions** | ❌ | ❌ | ❌ | ✅ |
| **Missing auth checks** | ❌ | ❌ | ❌ | ✅ |
| **Race conditions** | ❌ | ❌ | ❌ | ✅ |
| **TOCTOU** | ❌ | ❌ | ❌ | ✅ |
| **Performance** | Fastest | Fast | Medium | Slower |

## Supported Languages

| Language | CFG | DFG | Semantic Rules |
|----------|-----|-----|----------------|
| JavaScript | ✅ | ✅ | 50 rules |
| TypeScript | ✅ | ✅ | 50 rules |
| Python | ✅ | ✅ | 48 rules |
| Java | ✅ | ✅ | 45 rules |
| Go | ✅ | ✅ | 40 rules |
| C/C++ | ✅ | ✅ | 35 rules (memory safety) |
| C# | ✅ | ✅ | 38 rules |
| Rust | ✅ | ✅ | 30 rules |
| PHP | ✅ | ✅ | 35 rules |
| Ruby | ✅ | ✅ | 33 rules |

## Visualization

Export CFG/DFG/CPG to DOT format for visualization:

```javascript
import { SemanticAnalyzer } from './semantic-analyzer.js';

const analyzer = new SemanticAnalyzer(ast, 'javascript', 'app.js');
analyzer.analyze();

// Export to Graphviz DOT format
const dot = analyzer.exportDot();
console.log(dot);

// Visualize with: dot -Tpng cfg.dot -o cfg.png
```

## Integration with Existing Tools

Semantic analysis **augments** existing engines - findings are merged:

```json
{
  "file": "app.js",
  "issues_count": 15,
  "issues": [
    {
      "ruleId": "javascript.sql-injection",
      "engine": "ast",
      "severity": "error"
    },
    {
      "ruleId": "semantic.missing-auth-check",
      "engine": "semantic",
      "severity": "error"
    },
    {
      "ruleId": "generic.hardcoded-secret",
      "engine": "regex",
      "severity": "error"
    }
  ]
}
```

## Future Enhancements

### Planned (v3.19.0+)

- **Inter-procedural CFG** - Track across function calls
- **Pointer alias analysis** - Better tracking of memory operations
- **Path-sensitive analysis** - Consider branch conditions in findings
- **Context-sensitive analysis** - Per-call-site function analysis
- **Loop invariant detection** - Find loop-carried dependencies
- **Symbolic execution** - Prove/disprove vulnerabilities with constraints

### Under Research

- **Machine learning integration** - Learn auth patterns from codebase
- **Abstract interpretation** - Sound static analysis guarantees
- **Constraint solving** - SMT-based vulnerability proof
- **Incremental analysis** - Only re-analyze changed code regions

## References

- **CWE (Common Weakness Enumeration)**: https://cwe.mitre.org/
- **OWASP Top 10**: https://owasp.org/Top10/
- **Reaching Definitions**: Classic dataflow analysis algorithm
- **Live Variables**: Backward dataflow analysis
- **Code Property Graphs**: Combining CFG, DFG, and AST for security analysis

## Credits

Semantic analysis implementation inspired by:
- Semgrep's pattern matching
- CodeQL's dataflow analysis
- Infer's separation logic
- Joern's code property graphs
