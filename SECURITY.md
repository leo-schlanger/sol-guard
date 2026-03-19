# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues via:

1. **Email**: security@solguard.io
2. **PGP Key**: Available at [solguard.io/pgp-key.txt](https://solguard.io/pgp-key.txt)

### What to Include

Please provide the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if any)
- Your contact information for follow-up

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Initial Response | Within 24 hours |
| Triage and Assessment | Within 72 hours |
| Fix Development | Depends on severity |
| Public Disclosure | After fix is deployed |

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Remote code execution, data breach | Immediate |
| High | Authentication bypass, privilege escalation | 24 hours |
| Medium | Information disclosure, XSS | 1 week |
| Low | Minor issues, best practice violations | 2 weeks |

## Security Best Practices

### For Users

1. **Protect your API keys**: Never commit API keys to version control
2. **Use HTTPS**: Always use secure connections
3. **Rotate credentials**: Regularly rotate API keys and passwords
4. **Monitor usage**: Review API usage for suspicious activity

### For Developers

1. **Input validation**: Validate all user inputs using Zod schemas
2. **Parameterized queries**: Use Drizzle ORM to prevent SQL injection
3. **Rate limiting**: Respect rate limits to prevent abuse
4. **Secure defaults**: Use secure default configurations

## Security Features

### Authentication
- JWT tokens with RS256 signing
- Token expiration and refresh mechanism
- Bcrypt password hashing (12+ rounds)

### Authorization
- Role-based access control (RBAC)
- API key scoping and permissions
- Resource-level access controls

### Data Protection
- TLS 1.3 for data in transit
- AES-256 encryption for sensitive data at rest
- PII minimization and anonymization

### Infrastructure
- WAF (Web Application Firewall)
- DDoS protection
- Regular security audits
- Penetration testing

## Acknowledgments

We appreciate the security research community's efforts in helping keep SolGuard secure. Responsible disclosure contributors will be acknowledged in our security hall of fame (with permission).

## Contact

- **Security Team**: security@solguard.io
- **General Support**: support@solguard.io
