<div align="center">

# @theluckystrike/webext-messaging

Type-safe, promise-based message passing for Chrome extensions. Define your message types once, get full TypeScript inference across background scripts, content scripts, and popups.

[![npm version](https://img.shields.io/npm/v/@theluckystrike/webext-messaging)](https://www.npmjs.com/package/@theluckystrike/webext-messaging)
[![npm downloads](https://img.shields.io/npm/dm/@theluckystrike/webext-messaging)](https://www.npmjs.com/package/@theluckystrike/webext-messaging)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@theluckystrike/webext-messaging)

[Installation](#installation) · [Quick Start](#quick-start) · [API](#api) · [License](#license)

</div>

---

## Features

- **Fully typed** -- define message contracts as TypeScript types
- **Promise-based** -- async/await instead of callbacks
- **Background + tab messaging** -- `send()` and `sendTab()` with typed payloads
- **Handler map** -- register all handlers in one place with `onMessage()`
- **Error handling** -- `MessagingError` wraps `chrome.runtime.lastError`
- **Zero dependencies** -- just TypeScript and the Chrome API

## Installation

```bash
npm install @theluckystrike/webext-messaging
```

<details>
<summary>Other package managers</summary>

```bash
pnpm add @theluckystrike/webext-messaging
# or
yarn add @theluckystrike/webext-messaging
```

</details>

## Quick Start

```typescript
import { createMessenger } from "@theluckystrike/webext-messaging";

type Messages = {
  getUser: { request: { id: number }; response: { name: string } };
  ping: { request: { ts: number }; response: { pong: true } };
};

const msg = createMessenger<Messages>();

// Background — register handlers
msg.onMessage({
  getUser: async ({ id }) => ({ name: "Alice" }),
  ping: ({ ts }) => ({ pong: true }),
});

// Content script or popup — send messages
const user = await msg.send("getUser", { id: 42 });
```

## API

| Method | Description |
|--------|-------------|
| `createMessenger<M>()` | Returns a typed `Messenger` with `send`, `sendTab`, and `onMessage` |
| `send(type, payload)` | Send via `chrome.runtime.sendMessage` (content script / popup to background) |
| `sendTab(opts, type, payload)` | Send via `chrome.tabs.sendMessage` (background to content script) |
| `onMessage(handlers)` | Register a handler map. Returns an unsubscribe function |



## Part of @zovo/webext

This package is part of the [@zovo/webext](https://github.com/theluckystrike) family -- typed, modular utilities for Chrome extension development:

| Package | Description |
|---------|-------------|
| [webext-storage](https://github.com/theluckystrike/webext-storage) | Typed storage with schema validation |
| [webext-messaging](https://github.com/theluckystrike/webext-messaging) | Type-safe message passing |
| [webext-tabs](https://github.com/theluckystrike/webext-tabs) | Tab query helpers |
| [webext-cookies](https://github.com/theluckystrike/webext-cookies) | Promise-based cookies API |
| [webext-i18n](https://github.com/theluckystrike/webext-i18n) | Internationalization toolkit |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License -- see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [theluckystrike](https://github.com/theluckystrike) · [zovo.one](https://zovo.one)

</div>
