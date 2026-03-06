# Contributing to webext-messaging

Thank you for considering contributing to this project! We welcome all contributions, whether they are bug reports, feature requests, documentation improvements, or code changes.

## How to File Issues

- Search existing issues before opening a new one to avoid duplicates.
- Use the provided issue templates (Bug Report or Feature Request) when creating new issues.
- Provide as much detail as possible to help us understand and reproduce the problem or evaluate the request.

## Development Workflow

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/webext-messaging.git
   cd webext-messaging
   ```
3. **Create a branch** for your change:
   ```bash
   git checkout -b my-feature
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Make your changes** and ensure they follow the project's code style.
6. **Run tests** to verify nothing is broken:
   ```bash
   npm test
   ```
7. **Commit** your changes with a clear, descriptive commit message.
8. **Push** your branch to your fork:
   ```bash
   git push origin my-feature
   ```
9. **Open a Pull Request** against the `main` branch of this repository.

## Pull Request Guidelines

- Keep PRs focused on a single change or feature.
- Include a clear description of what the PR does and why.
- Add or update tests for any new functionality.
- Update documentation if your change affects the public API.
- Ensure all tests pass before requesting a review.

## Code Style

- Write clean, readable TypeScript.
- Follow existing conventions in the codebase.
- Use meaningful variable and function names.
- Add comments where the intent is not immediately obvious.

## Running Tests

```bash
npm test
```

All tests must pass before a pull request will be merged.

## License

By contributing, you agree that your contributions will be licensed under the same license as this project.
