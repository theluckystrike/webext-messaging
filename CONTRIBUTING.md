# Contributing to @theluckystrike/webext-messaging

Thanks for your interest in contributing.


REPORTING ISSUES

Open an issue on GitHub. Include the browser, manifest version, package version, and steps to reproduce the problem. A minimal reproduction repo or code snippet helps a lot.


DEVELOPMENT WORKFLOW

Fork the repo and clone your fork locally.

  git clone https://github.com/YOUR_USERNAME/webext-messaging.git
  cd webext-messaging
  npm install

Create a branch for your change.

  git checkout -b my-change

Make your changes, then run the tests.

  npm test

Push your branch and open a pull request against main.


CODE STYLE

Write TypeScript with strict mode enabled. Keep functions small and focused. Add JSDoc comments for public API surface. Follow the patterns already in the codebase.


TESTING

Every new feature or bug fix should include a test. The test suite uses Vitest. Run npm test before submitting your PR.


LICENSE

By contributing, you agree that your contributions will be licensed under the MIT License.
