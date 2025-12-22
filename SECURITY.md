# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of TaskFlow seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Discuss the vulnerability in public forums
- Share the vulnerability with others until it has been resolved

### Please DO:

1. **Email us directly** at: security@taskflow.com (or create a private security advisory on GitHub)
2. **Include the following information:**
   - Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the vulnerability, including how an attacker might exploit it

3. **Allow us time to respond** - We will acknowledge your report within 48 hours and provide a more detailed response within 7 days.

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 7 days
- **Updates**: We will keep you informed of our progress every 7-10 days
- **Resolution**: We will work with you to understand and resolve the issue quickly

### Disclosure Policy

- We will credit you for the discovery (unless you prefer to remain anonymous)
- We will not disclose your name or contact information without your permission
- We will work with you to coordinate public disclosure after a fix is available

## Security Best Practices

### For Users

1. **Keep dependencies updated**: Regularly update your dependencies to receive security patches
2. **Use strong secrets**: Generate strong, unique secrets for JWT tokens and database passwords
3. **Enable HTTPS**: Always use HTTPS in production environments
4. **Review access logs**: Regularly review authentication and access logs
5. **Follow principle of least privilege**: Grant users only the minimum permissions they need

### For Developers

1. **Input Validation**: Always validate and sanitize user input
2. **Authentication**: Use secure authentication mechanisms (JWT with HttpOnly cookies)
3. **Authorization**: Implement proper role-based access control
4. **Secrets Management**: Never commit secrets to version control
5. **Dependency Scanning**: Regularly scan dependencies for known vulnerabilities
6. **Code Review**: All code changes should be reviewed by at least one other developer
7. **Security Testing**: Include security testing in your development workflow

## Known Security Considerations

### Authentication
- JWT tokens are stored in HttpOnly cookies to prevent XSS attacks
- Access tokens have short expiration times (15 minutes)
- Refresh tokens are rotated on each use
- Passwords are hashed using bcrypt with 12 salt rounds

### API Security
- Rate limiting is implemented to prevent abuse
- CORS is configured to allow only trusted origins
- Input validation is performed on all endpoints using class-validator
- SQL injection is prevented through TypeORM parameterized queries

### Infrastructure
- Database connections use encrypted connections where possible
- Redis is configured with authentication in production
- Docker images are regularly updated to include security patches

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1, 0.1.2). We recommend:

- Subscribing to security advisories on GitHub
- Monitoring the CHANGELOG.md for security-related updates
- Keeping your dependencies up to date

## Security Checklist for Deployment

Before deploying to production, ensure:

- [ ] All environment variables are set with secure values
- [ ] JWT secrets are strong and unique (at least 32 characters)
- [ ] Database passwords are strong and unique
- [ ] HTTPS is enabled and configured
- [ ] CORS origins are restricted to your domain(s)
- [ ] Rate limiting is configured appropriately
- [ ] Logging is enabled for security events
- [ ] Dependencies are up to date
- [ ] Security headers are configured (HSTS, CSP, etc.)
- [ ] Regular backups are configured
- [ ] Monitoring and alerting are set up

## Contact

For security-related questions or concerns, please contact:
- **Email**: security@taskflow.com
- **GitHub Security Advisory**: Create a private security advisory in the repository

Thank you for helping keep TaskFlow and its users safe!






