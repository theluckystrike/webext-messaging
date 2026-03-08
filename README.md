<div align="center">

# @theluckystrike/webext-messaging

<p align="center">
  <strong>Type-safe, promise-based message passing for Chrome extensions (Manifest V3)</strong>
</p>

[![npm version](https://img.shields.io/npm/v/@theluckystrike/webext-messaging?color=success&label=npm&style=flat-square)](https://www.npmjs.com/package/@theluckystrike/webext-messaging)
[![npm downloads](https://img.shields.io/npm/dm/@theluckystrike/webext-messaging?color=blue&label=downloads&style=flat-square)](https://www.npmjs.com/package/@theluckystrike/webext-messaging)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@theluckystrike/webext-messaging?color=yellow&label=size&style=flat-square)](https://bundlephobia.com/package/@theluckystrike/webext-messaging)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-blue?style=flat-square)](https://github.com/theluckystrike/webext-messaging/actions)

Define your message contracts once as TypeScript types, and get full type inference across your entire Chrome extension — background scripts, content scripts, popups, side panels, and options pages.

[Installation](#installation) · [Quick Start](#quick-start) · [Full API Reference](#api-reference) · [Examples](#examples) · [Part of @zovo/webext](#part-of-zovo-webext) · [License](#license)

</div>

---

## What is this?

`@theluckystrike/webext-messaging` is a lightweight TypeScript library that provides type-safe, promise-based message passing for Chrome extensions built with Manifest V3.

Chrome's native `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage` APIs use callbacks and `chrome.runtime.lastError` for error handling — which means you lose all type safety and must manually check for errors. This library wraps those APIs to provide:

- **Full TypeScript inference** — define your message types once, get autocomplete everywhere
- **Promise-based API** — use modern `async/await` instead of callback hell
- **Proper error handling** — no more checking `chrome.runtime.lastError`
- **Bidirectional communication** — send messages from content scripts ↔ background, and background → content scripts

### Why do I need this?

Without type-safe messaging, you likely have code that looks like this:

```typescript
// ❌ Old way — no type safety, callback-based, error-prone
chrome.runtime.sendMessage(
  { type: "GET_USER", payload: { id: 42 } },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }
    // response could be anything!
    console.log(response.name); // TypeScript has no idea what this is
  }
);
```

With this library, you get:

```typescript
// ✅ New way — fully typed, promise-based, safe
const response = await msg.send("getUser", { id: 42 });
console.log(response.name); // TypeScript knows exactly what this is!
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Fully Typed** | Define message contracts as TypeScript types with full inference across your entire extension |
| **Promise-Based** | Modern `async/await` API instead of callbacks |
| **Bidirectional** | Send messages between background ↔ content scripts with `send()` and `sendTab()` |
| **Handler Maps** | Register multiple handlers in one place with `onMessage()` |
| **Proper Errors** | `MessagingError` wraps `chrome.runtime.lastError` properly |
| **Zero Dependencies** | Only TypeScript and the Chrome API — no runtime bloat |
| **Manifest V3 Ready** | Designed for service workers and modern Chrome extension patterns |
| **TypeScript First** | Every function, payload, and response is fully typed |
| **Small Bundle** | Under 2KB minified + gzipped |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [TypeScript](https://www.typescriptlang.org/) 5.0+
- A Chrome extension project

### Install the package

```bash
npm install @theluckystrike/webext-messaging
```

<details>
<summary>Other package managers</summary>

```bash
# pnpm
pnpm add @theluckystrike/webext-messaging

# yarn
yarn add @theluckystrike/webext-messaging
```

</details>

### Type definitions

This package includes TypeScript type definitions out of the box. No additional `@types` packages required!

---

## Quick Start

### Step 1: Define your message types

Create a type that describes all the messages in your extension:

```typescript
// types/messages.ts
export type Messages = {
  // Key: message type name
  // Value: { request: input shape, response: output shape }
  getUser: {
    request: { id: number };
    response: { name: string; email: string };
  };
  ping: {
    request: { timestamp: number };
    response: { pong: true; serverTime: number };
  };
  setSettings: {
    request: { theme: "light" | "dark"; notifications: boolean };
    response: { success: boolean };
  };
};
```

### Step 2: Create a typed messenger

In each of your extension's contexts (background, content script, popup), create a messenger instance:

```typescript
import { createMessenger } from "@theluckystrike/webext-messaging";
import type { Messages } from "./types/messages";

const msg = createMessenger<Messages>();
```

### Step 3: Register handlers (background script)

In your background service worker, register handlers for incoming messages:

```typescript
// background.ts
import { createMessenger } from "@theluckystrike/webext-messaging";
import type { Messages } from "./types/messages";

const msg = createMessenger<Messages>();

// Register all handlers at once
msg.onMessage({
  getUser: async ({ id }) => {
    // Simulate an async database lookup
    const user = await database.getUser(id);
    return {
      name: user.name,
      email: user.email,
    };
  },

  ping: ({ timestamp }) => {
    // Synchronous handlers work too!
    return {
      pong: true,
      serverTime: Date.now(),
    };
  },

  setSettings: async ({ theme, notifications }) => {
    await storage.set({ theme, notifications });
    return { success: true };
  },
});

console.log("Background service worker initialized");
```

### Step 4: Send messages (content script or popup)

From content scripts, popups, side panels, or options pages, send messages to the background:

```typescript
// content-script.ts or popup.ts
import { createMessenger } from "@theluckystrike/webext-messaging";
import type { Messages } from "./types/messages";

const msg = createMessenger<Messages>();

// Send to background service worker
async function onGetUser(id: number) {
  try {
    const user = await msg.send("getUser", { id });
    console.log(`Hello, ${user.name}!`); // Fully typed!
  } catch (error) {
    if (error instanceof MessagingError) {
      console.error("Failed to get user:", error.message);
    }
  }
}

async function onPing() {
  const response = await msg.send("ping", { timestamp: Date.now() });
  console.log("Ping latency:", response.serverTime - Date.now(), "ms");
}

// Update settings
async function onSetTheme(theme: "light" | "dark") {
  await msg.send("setSettings", { theme, notifications: true });
}
```

### Step 5: Send messages to specific tabs (background → content script)

From the background service worker, send messages to content scripts in specific tabs:

```typescript
// background.ts
const msg = createMessenger<Messages>();

// Send to a content script in a specific tab
async function notifyContentScript(tabId: number) {
  const response = await msg.sendTab(
    { tabId },
    "ping",
    { timestamp: Date.now() }
  );
  console.log("Content script responded:", response);
}

// Send to a specific frame within a tab
async function notifySpecificFrame(tabId: number, frameId: number) {
  const response = await msg.sendTab(
    { tabId, frameId },
    "ping",
    { timestamp: Date.now() }
  );
}
```

---

## API Reference

### Core Functions

#### `createMessenger<M extends MessageMap>(): Messenger<M>`

Creates a fully typed messenger instance bound to your message types.

```typescript
import { createMessenger } from "@theluckystrike/webext-messaging";

type Messages = {
  ping: { request: { ts: number }; response: { pong: true } };
};

const msg = createMessenger<Messages>();
```

Returns a `Messenger` object with `send()`, `sendTab()`, and `onMessage()` methods.

---

### Messenger Methods

#### `messenger.send<K extends keyof M & string>(type: K, payload: RequestOf<M, K>): Promise<ResponseOf<M, K>>`

Sends a typed message via `chrome.runtime.sendMessage`. Use from:

- Content scripts → background service worker
- Popups → background service worker
- Options page → background service worker
- Side panel → background service worker

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `K` | The message type key from your `MessageMap` |
| `payload` | `RequestOf<M, K>` | The request payload (fully typed!) |

**Returns:** `Promise<ResponseOf<M, K>>` — resolves with the typed response, rejects with `MessagingError` on failure.

**Example:**

```typescript
const response = await msg.send("getUser", { id: 42 });
// TypeScript knows: response is { name: string; email: string }
```

---

#### `messenger.sendTab<K extends keyof M & string>(options: TabMessageOptions, type: K, payload: RequestOf<M, K>): Promise<ResponseOf<M, K>>`

Sends a typed message to a specific tab via `chrome.tabs.sendMessage`. Use from:

- Background service worker → content scripts
- Popup → content scripts (if you have the tab ID)

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `TabMessageOptions` | `{ tabId: number; frameId?: number }` |
| `type` | `K` | The message type key from your `MessageMap` |
| `payload` | `RequestOf<M, K>` | The request payload (fully typed!) |

**Returns:** `Promise<ResponseOf<M, K>>`

**Example:**

```typescript
// Send to tab
await msg.sendTab({ tabId: 123 }, "ping", { ts: Date.now() });

// Send to specific frame in a tab
await msg.sendTab({ tabId: 123, frameId: 0 }, "ping", { ts: Date.now() });
```

---

#### `messenger.onMessage(handlers: HandlerMap<M>): () => void`

Registers typed handlers for incoming messages. Returns an unsubscribe function.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `handlers` | `HandlerMap<M>` | An object mapping message types to handler functions |

**Handler signature:** `(payload: RequestOf<M, K>, sender: chrome.runtime.MessageSender) => ResponseOf<M, K> | Promise<ResponseOf<M, K>>`

**Returns:** `() => void` — call to remove the listener

**Example:**

```typescript
const unsubscribe = msg.onMessage({
  getUser: async ({ id }, sender) => {
    console.log(`Request from tab ${sender.tab?.id}`);
    return { name: "Alice", email: "alice@example.com" };
  },
  ping: ({ ts }) => ({ pong: true }),
});

// Later, stop listening
unsubscribe();
```

---

### Standalone Functions

If you prefer functions over the messenger object, these are also exported:

| Function | Description |
|----------|-------------|
| `sendMessage<M, K>(type, payload)` | Same as `Messenger.send` |
| `sendTabMessage<M, K>(options, type, payload)` | Same as `Messenger.sendTab` |
| `onMessage<M>(handlers)` | Same as `Messenger.onMessage` |

---

### Types

All types are exported for advanced use cases:

#### `MessageMap`

The base type for message contracts:

```typescript
type MessageMap = Record<string, { request: unknown; response: unknown }>;
```

#### `RequestOf<M, K>`

Extracts the request type for a given message key:

```typescript
type Request = RequestOf<Messages, "getUser">;
// { id: number }
```

#### `ResponseOf<M, K>`

Extracts the response type for a given message key:

```typescript
type Response = ResponseOf<Messages, "getUser">;
// { name: string; email: string }
```

#### `Envelope<M, K>`

The wire format sent over `chrome.runtime` / `chrome.tabs`:

```typescript
type Envelope = Envelope<Messages, "getUser">;
// { type: "getUser"; payload: { id: number } }
```

#### `Handler<M, K>`

The handler function signature:

```typescript
type Handler = Handler<Messages, "getUser">;
// (payload: { id: number }, sender: MessageSender) => 
//   { name: string; email: string } | Promise<{ name: string; email: string }>
```

#### `HandlerMap<M>`

A partial map of handlers:

```typescript
type MyHandlers = HandlerMap<Messages>;
// {
//   getUser?: Handler<Messages, "getUser">;
//   ping?: Handler<Messages, "ping">;
//   setSettings?: Handler<Messages, "setSettings">;
// }
```

#### `TabMessageOptions`

Options for sending to a specific tab:

```typescript
interface TabMessageOptions {
  tabId: number;
  frameId?: number;
}
```

#### `Messenger<M>`

The full messenger interface:

```typescript
interface Messenger<M extends MessageMap> {
  send<K extends keyof M & string>(
    type: K,
    payload: RequestOf<M, K>
  ): Promise<ResponseOf<M, K>>;

  sendTab<K extends keyof M & string>(
    options: TabMessageOptions,
    type: K,
    payload: RequestOf<M, K>
  ): Promise<ResponseOf<M, K>>;

  onMessage(handlers: HandlerMap<M>): () => void;
}
```

---

### Error Handling

#### `MessagingError`

A custom error class that wraps Chrome messaging failures:

```typescript
import { MessagingError } from "@theluckystrike/webext-messaging";

try {
  await msg.send("getUser", { id: 999 });
} catch (error) {
  if (error instanceof MessagingError) {
    console.error("Messaging failed:", error.message);
    console.error("Original error:", error.originalError);
  }
}
```

The `MessagingError` class:

- Extends the built-in `Error` class
- Adds an `originalError` property with the underlying error
- Includes the message type and Chrome error details in the message

---

## Examples

### Example 1: Full Extension Setup

Here's how all the pieces fit together in a real Chrome extension:

```typescript
// ============== shared/types/messages.ts ==============
export type Messages = {
  getSettings: {
    request: void;  // no request payload
    response: { theme: "light" | "dark"; language: string };
  };
  updateSettings: {
    request: { theme: "light" | "dark"; language: string };
    response: { success: boolean };
  };
  openTab: {
    request: { url: string };
    response: { tabId: number };
  };
};

// ============== background/background.ts ==============
import { createMessenger } from "@theluckystrike/webext-messaging";
import type { Messages } from "../shared/types/messages";

const msg = createMessenger<Messages>();

// Initialize handlers
msg.onMessage({
  getSettings: async () => {
    const stored = await chrome.storage.local.get(["theme", "language"]);
    return {
      theme: stored.theme ?? "light",
      language: stored.language ?? "en",
    };
  },

  updateSettings: async ({ theme, language }) => {
    await chrome.storage.local.set({ theme, language });
    // Notify all tabs about the change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        msg.sendTab({ tabId: tab.id }, "settingsUpdated", { theme, language });
      }
    }
    return { success: true };
  },

  openTab: async ({ url }) => {
    const tab = await chrome.tabs.create({ url });
    return { tabId: tab.id! };
  },
});

// ============== content-script/content.ts ==============
import { createMessenger } from "@theluckystrike/webext-messaging";
import type { Messages } from "../shared/types/messages";

const msg = createMessenger<Messages>();

// Get settings when page loads
async function init() {
  const settings = await msg.send("getSettings", undefined);
  applyTheme(settings.theme);
  applyLanguage(settings.language);
}

// Listen for settings changes from background
msg.onMessage({
  settingsUpdated: ({ theme, language }) => {
    applyTheme(theme);
    applyLanguage(language);
  },
});
```

### Example 2: Using with React/Vue Popup

```typescript
// popup.tsx (React)
import { createMessenger } from "@theluckystrike/webext-messaging";

const msg = createMessenger<Messages>();

function Popup() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user when popup opens
    msg.send("getCurrentUser", {}).then(setUser).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await msg.send("logout", {});
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <>
          <h1>Welcome, {user.name}</h1>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Example 3: Cross-Frame Communication

```typescript
// From background, send to a specific iframe within a tab
async function notifyIframe(tabId: number, frameId: number) {
  try {
    const response = await msg.sendTab(
      { tabId, frameId },
      "iframeReady",
      { timestamp: Date.now() }
    );
    console.log("Frame acknowledged:", response);
  } catch (error) {
    if (error instanceof MessagingError) {
      console.error("Frame might not be ready yet:", error.message);
    }
  }
}
```

### Example 4: Error Handling Patterns

```typescript
// Graceful degradation when background isn't available
async function safeSend<T>(type: string, payload: unknown): Promise<T | null> {
  try {
    return await msg.send(type as any, payload);
  } catch (error) {
    if (error instanceof MessagingError) {
      // Log but don't throw — extension context might be invalidated
      console.warn(`Message "${type}" failed:`, error.message);
      return null;
    }
    throw error;
  }
}

// Usage
const user = await safeSend<User>("getUser", { id: 42 });
if (user) {
  console.log(user.name);
}
```

---

## Best Practices

### 1. Share types between contexts

Put your message types in a shared location and import them in all your extension contexts:

```
my-extension/
├── src/
│   ├── background/
│   │   └── background.ts
│   ├── content/
│   │   └── content.ts
│   ├── popup/
│   │   └── popup.tsx
│   └── shared/
│       └── types.ts  ← shared message types
```

### 2. Use void for request-less messages

If a message doesn't need a request payload, use `void`:

```typescript
type Messages = {
  getStatus: { request: void; response: { online: boolean } };
  ping: { request: void; response: { pong: true } };
};

// Usage
await msg.send("ping", undefined);
// or
await msg.send("ping", {});
```

### 3. Always handle errors

Always wrap message sends in try/catch to handle edge cases:

```typescript
try {
  const result = await msg.send("getData", { id: 1 });
} catch (error) {
  if (error instanceof MessagingError) {
    // Handle gracefully
  }
}
```

### 4. Clean up listeners

Always unsubscribe when your context is destroyed:

```typescript
// In a React component
useEffect(() => {
  const unsubscribe = msg.onMessage({
    update: (data) => { /* ... */ },
  });
  
  return () => unsubscribe();
}, []);
```

---

## TypeScript Configuration

For the best experience, ensure your `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Browser Support

This library works with any Chrome extension targeting Manifest V3:

- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+
- ✅ Other Chromium-based browsers

> **Note:** This library uses `chrome.runtime` and `chrome.tabs` APIs, which are available in all modern Chromium-based browsers.

---

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

---

## Part of @zovo/webext

This package is part of the [@zovo/webext](https://github.com/theluckystrike) family — a collection of typed, modular utilities for Chrome extension development:

| Package | Description | npm |
|---------|-------------|-----|
| [webext-messaging](https://github.com/theluckystrike/webext-messaging) | Type-safe message passing | [@theluckystrike/webext-messaging](https://npmjs.com/package/@theluckystrike/webext-messaging) |
| [webext-storage](https://github.com/theluckystrike/webext-storage) | Typed storage with schema validation | [@theluckystrike/webext-storage](https://npmjs.com/package/@theluckystrike/webext-storage) |
| [webext-tabs](https://github.com/theluckystrike/webext-tabs) | Tab query and manipulation helpers | [@theluckystrike/webext-tabs](https://npmjs.com/package/@theluckystrike/webext-tabs) |
| [webext-cookies](https://github.com/theluckystrike/webext-cookies) | Promise-based cookies API | [@theluckystrike/webext-cookies](https://npmjs.com/package/@theluckystrike/webext-cookies) |
| [webext-i18n](https://github.com/theluckystrike/webext-i18n) | Internationalization toolkit | [@theluckystrike/webext-i18n](https://npmjs.com/package/@theluckystrike/webext-i18n) |

---

## Related Resources

Looking for more Chrome extension guides? Check out these resources:

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/) — Official Chrome docs
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/) — Migrating from MV2 to MV3
- [Chrome Extension Guide](https://zovo.one) — Comprehensive guides and tutorials for building Chrome extensions

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by [theluckystrike](https://github.com/theluckystrike)

[Website](https://zovo.one) · [GitHub](https://github.com/theluckystrike/webext-messaging) · [npm](https://npmjs.com/package/@theluckystrike/webext-messaging)

</div>
