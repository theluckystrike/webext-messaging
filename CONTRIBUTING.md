# Contributing to @zovo/webext-messaging

Thank you for your interest in contributing! This library provides typed message passing for Chrome extensions, and we welcome contributions from the community.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `pnpm install` (this project uses pnpm)
3. **Run tests**: `pnpm test`
4. **Build**: `pnpm build`

## Development Workflow

```bash
# Start test watcher
pnpm test:watch

# Type checking
pnpm typecheck

# Build the library
pnpm build
```

## Reporting Bugs

Found a bug? Please help us by opening an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node version, browser version)
- Any relevant error messages or logs

See the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md) for guidance.

## Requesting Features

Have an idea for a new feature? Open an issue using our [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md).

When proposing features:
- Explain the use case and why it would be valuable
- Describe the API you'd like to see (if applicable)
- Consider whether this fits the library's scope (typed message passing for Chrome extensions)

## Pull Request Guidelines

1. **Follow existing code style** - This project uses TypeScript with standard formatting
2. **Add tests** for any new functionality
3. **Update documentation** if your change affects the API
4. **Keep PRs focused** - One feature or fix per PR
5. **Write meaningful commit messages**

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation is updated (if needed)

## Code Style

- Use TypeScript strict mode
- Prefer functional patterns where appropriate
- Keep functions small and focused
- Add JSDoc comments for public APIs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
