# Project Constitution

## Core Principles

### 1. Development Philosophy
- **Simplicity First**: Choose simple, maintainable solutions over complex ones
- **Progressive Enhancement**: Start with MVP, iterate based on feedback
- **Security by Default**: Implement security best practices from the beginning
- **Performance Matters**: Optimize for user experience and efficiency

### 2. Technical Standards
- **Type Safety**: Use TypeScript for all new code
- **Code Quality**: Enforce ESLint and Prettier rules
- **Testing**: Maintain minimum 70% test coverage
- **Documentation**: Document all public APIs and complex logic

### 3. Architecture Guidelines
- **Separation of Concerns**: Clear boundaries between layers
- **Single Responsibility**: Each component/function does one thing well
- **Dependency Injection**: Prefer composition over inheritance
- **Event-Driven**: Use events for loose coupling

## Development Constraints

### Technology Choices
- **Frontend**: Next.js 14+ with App Router
- **Backend**: Supabase for all backend services
- **Deployment**: Vercel for hosting
- **Development Tools**: Claude Code + GitHub

### Quality Requirements
- **Performance**: Page load < 3 seconds
- **Availability**: 99.9% uptime target
- **Security**: OWASP Top 10 compliance
- **Accessibility**: WCAG 2.1 AA compliance

### Process Requirements
- **Version Control**: Git with conventional commits
- **Code Review**: All changes via pull requests
- **CI/CD**: Automated testing and deployment
- **Documentation**: Update docs with code changes

## Non-Negotiables

1. **No Hardcoded Secrets**: All sensitive data in environment variables
2. **No Direct Database Access**: Always use Supabase client
3. **No Untested Code**: Every feature must have tests
4. **No Undocumented APIs**: All endpoints must be documented
5. **No Breaking Changes**: Maintain backward compatibility

## Success Metrics

- **Development Velocity**: Complete setup in 1 week
- **Code Quality**: Zero critical security issues
- **Performance**: Core Web Vitals in green zone
- **User Experience**: Intuitive and responsive UI
- **Maintainability**: Clear code structure and documentation