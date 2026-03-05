---
name: Bug report
about: Create a report to help us improve
title: '[Bug] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened instead of the expected behavior.

## Environment

- OS: [e.g., macOS 14.0]
- Node version: [e.g., v20.10.0]
- pnpm version: [e.g., 8.15.0]
- Browser: [e.g., Chrome 120]
- Library version: [e.g., 1.0.0]

## Code Sample

```typescript
// Include a minimal reproducible example
import { createMessenger } from "@zovo/webext-messaging";

type Messages = {
  ping: { request: void; response: { pong: boolean } };
};

const msg = createMessenger<Messages>();

// Your code here
```

## Error Message

```
Paste any error messages here
```

## Additional Context

Add any other context about the problem here.
