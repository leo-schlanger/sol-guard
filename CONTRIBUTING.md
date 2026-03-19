# Contributing to SolGuard

Thank you for your interest in contributing to SolGuard. This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Architecture Decisions](#architecture-decisions)

---

## Code of Conduct

### Our Standards

- **Be respectful**: Treat all contributors with respect and consideration
- **Be constructive**: Provide helpful feedback and suggestions
- **Be inclusive**: Welcome contributors of all backgrounds and skill levels
- **Be professional**: Maintain a professional tone in all communications

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Docker and Docker Compose
- Git

### Setting Up the Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/sol-guard.git
cd sol-guard

# 3. Add upstream remote
git remote add upstream https://github.com/solguard/sol-guard.git

# 4. Install dependencies
npm install

# 5. Copy environment configuration
cp .env.example .env

# 6. Start infrastructure services
docker-compose up -d postgres redis

# 7. Start development server
npm run dev
```

### Project Structure

```
sol-guard/
├── apps/
│   ├── api/           # Backend Fastify server
│   ├── web/           # Frontend React application
│   └── extension/     # Browser extension (planned)
├── packages/
│   ├── blockchain/    # Solana integration
│   ├── types/         # Shared TypeScript definitions
│   ├── ui/            # Shared UI components
│   └── shared/        # Common utilities
├── scripts/           # Build and utility scripts
├── docs/              # Documentation
└── tests/             # E2E and integration tests
```

---

## Development Workflow

### Branch Naming Convention

Use the following format for branch names:

```
<type>/<issue-number>-<short-description>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat/123-add-token-analysis
fix/456-resolve-cache-issue
docs/789-update-api-reference
```

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(api): add token risk analysis endpoint

- Implement risk score calculation
- Add caching layer for performance
- Include comprehensive error handling

Closes #123
```

```
fix(web): resolve infinite loop in useTokenAnalysis hook

The dependency array was missing the tokenAddress parameter,
causing unnecessary re-renders.

Fixes #456
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for a specific package
npm run test --workspace=apps/api

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

### Code Quality Checks

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Type checking
npm run type-check

# Run all checks (lint + type-check + test)
npm run validate
```

---

## Coding Standards

### TypeScript Guidelines

#### Use Strict Typing

```typescript
// Good
interface TokenAnalysisResult {
  address: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  analyzedAt: Date;
}

// Avoid
const result: any = await analyzeToken(address);
```

#### Prefer Interfaces Over Types

```typescript
// Preferred for object shapes
interface User {
  id: string;
  email: string;
  name: string;
}

// Use types for unions, intersections, and primitives
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ID = string | number;
```

#### Use Explicit Return Types

```typescript
// Good
async function calculateRiskScore(address: string): Promise<number> {
  // implementation
}

// Avoid
async function calculateRiskScore(address: string) {
  // implementation
}
```

### React Guidelines

#### Functional Components with TypeScript

```typescript
interface TokenCardProps {
  address: string;
  name: string;
  symbol: string;
  riskScore: number;
  onAnalyze?: () => void;
}

export function TokenCard({
  address,
  name,
  symbol,
  riskScore,
  onAnalyze
}: TokenCardProps): JSX.Element {
  return (
    <div className="token-card">
      {/* component content */}
    </div>
  );
}
```

#### Custom Hooks

```typescript
// Prefix with "use"
export function useTokenAnalysis(address: string) {
  const [data, setData] = useState<TokenAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // implementation

  return { data, isLoading, error };
}
```

### API Guidelines

#### RESTful Conventions

```typescript
// Route structure
// GET    /api/tokens          - List tokens
// GET    /api/tokens/:id      - Get single token
// POST   /api/tokens          - Create token
// PUT    /api/tokens/:id      - Update token
// DELETE /api/tokens/:id      - Delete token

// Response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

#### Error Handling

```typescript
// Use custom error classes
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Throw meaningful errors
if (!isValidAddress(address)) {
  throw new ApiError(
    400,
    'INVALID_TOKEN_ADDRESS',
    'The provided token address is not a valid Solana address',
    { field: 'address', value: address }
  );
}
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TokenCard.tsx` |
| Hooks | camelCase, use prefix | `useTokenAnalysis.ts` |
| Services | PascalCase | `RiskScoreService.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `TokenTypes.ts` |
| Tests | Same as source + `.test` | `RiskScoreService.test.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS.ts` |

### Documentation Standards

#### JSDoc Comments

```typescript
/**
 * Calculates the risk score for a Solana token.
 *
 * @param address - The token mint address
 * @param options - Analysis options
 * @returns The calculated risk score and analysis details
 *
 * @example
 * ```typescript
 * const result = await calculateRiskScore(
 *   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   { includeHistory: true }
 * );
 * console.log(result.riskScore); // 85
 * ```
 */
async function calculateRiskScore(
  address: string,
  options?: AnalysisOptions
): Promise<RiskScoreResult> {
  // implementation
}
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run validate
   ```

3. **Update documentation** if needed

4. **Add or update tests** for new functionality

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe how to test the changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] No new warnings generated
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Discussion and feedback** addressed
4. **Final approval** from maintainer
5. **Merge** using squash and merge

### Review Criteria

Reviewers will check for:

- [ ] Code correctness and logic
- [ ] Adherence to coding standards
- [ ] Test coverage
- [ ] Performance implications
- [ ] Security considerations
- [ ] Documentation completeness

---

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the Bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g., Windows 11]
- Node version: [e.g., 20.0.0]
- Browser: [e.g., Chrome 120]

**Additional Context**
Any other relevant information
```

### Feature Requests

Use the feature request template:

```markdown
**Is this related to a problem?**
Description of the problem

**Describe the Solution**
What you'd like to happen

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Any other relevant information
```

### Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | High priority issue |
| `wontfix` | Will not be worked on |

---

## Architecture Decisions

### ADR Process

For significant architectural changes, create an Architecture Decision Record (ADR):

```markdown
# ADR-001: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this change?
```

### Technology Choices

When proposing new dependencies or technologies:

1. **Document the need** - Why is this needed?
2. **Compare alternatives** - What options were considered?
3. **Assess impact** - Bundle size, performance, maintenance
4. **Security review** - Check for vulnerabilities
5. **License compatibility** - Ensure MIT compatibility

---

## Recognition

Contributors are recognized in:

- [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Release notes
- Project documentation

Thank you for contributing to SolGuard.
