# @zovo/webext-messaging

Promise-based typed message passing for Chrome extensions. No more untyped callbacks.

Part of [@zovo/webext](https://zovo.one).

## Install

```bash
npm install @zovo/webext-messaging
# or
pnpm add @zovo/webext-messaging
```

## Quick Start

### 1. Define your message map

```ts
// messages.ts
import type { MessageMap } from "@zovo/webext-messaging";

export type Messages = {
  getUser: { request: { id: number }; response: { name: string; email: string } };
  ping: { request: { ts: number }; response: { pong: true } };
  notify: { request: { text: string }; response: void };
};
```

### 2. Create a messenger

```ts
import { createMessenger } from "@zovo/webext-messaging";
import type { Messages } from "./messages";

export const msg = createMessenger<Messages>();
```

### 3. Listen in the background

```ts
// background.ts
import { msg } from "./messenger";

msg.onMessage({
  getUser: async ({ id }) => {
    const user = await db.getUser(id);
    return { name: user.name, email: user.email };
  },
  ping: ({ ts }) => ({ pong: true }),
});
```

### 4. Send from content script or popup

```ts
// content.ts
import { msg } from "./messenger";

const user = await msg.send("getUser", { id: 42 });
console.log(user.name); // fully typed
```

### 5. Send to a specific tab (background -> content script)

```ts
// background.ts
const result = await msg.sendTab({ tabId: 123 }, "notify", { text: "Hello tab!" });
```

## API Reference

### Types

#### `MessageMap`

Base type for defining request/response pairs:

```ts
type MyMessages = {
  [type: string]: { request: unknown; response: unknown };
};
```

#### `Envelope<M, K>`

The wire format sent over `chrome.runtime` / `chrome.tabs` messaging:

```ts
{ type: K; payload: M[K]["request"] }
```

#### `Handler<M, K>`

Handler function signature — can return sync or async:

```ts
(payload: RequestOf<M, K>, sender: chrome.runtime.MessageSender) =>
  ResponseOf<M, K> | Promise<ResponseOf<M, K>>;
```

#### `TabMessageOptions`

```ts
{ tabId: number; frameId?: number }
```

#### `MessagingError`

Custom error class with `originalError` property. Wraps `chrome.runtime.lastError` into real thrown errors instead of silent failures.

### Functions

#### `createMessenger<M>()`

Returns a `Messenger<M>` with typed `send`, `sendTab`, and `onMessage` methods. **This is the recommended API.**

```ts
const msg = createMessenger<MyMessages>();
```

#### `sendMessage<M, K>(type, payload)`

Send a typed message via `chrome.runtime.sendMessage`. Use from content scripts or popups to reach the background service worker.

```ts
const response = await sendMessage<MyMessages, "ping">("ping", { ts: Date.now() });
```

#### `sendTabMessage<M, K>(options, type, payload)`

Send a typed message to a specific tab via `chrome.tabs.sendMessage`. Use from background to reach content scripts.

```ts
const response = await sendTabMessage<MyMessages, "getUser">(
  { tabId: 123, frameId: 0 },
  "getUser",
  { id: 1 },
);
```

#### `onMessage<M>(handlers)`

Register typed message handlers. Returns an unsubscribe function.

- Sync and async handlers are both supported
- Async handlers automatically keep the message channel open
- Errors are caught, logged, and `undefined` is sent back (never silently swallowed)

```ts
const unsub = onMessage<MyMessages>({
  ping: ({ ts }) => ({ pong: true }),
  getUser: async ({ id }) => fetchUser(id),
});

// Later: unsub() to remove listeners
```

## Error Handling

`@zovo/webext-messaging` wraps `chrome.runtime.lastError` into proper `MessagingError` exceptions:

```ts
import { MessagingError } from "@zovo/webext-messaging";

try {
  await msg.send("getUser", { id: 1 });
} catch (err) {
  if (err instanceof MessagingError) {
    console.error(err.message);        // descriptive message with context
    console.error(err.originalError);   // the underlying error, if any
  }
}
```

Handler errors (sync throws or async rejections) are caught, logged to console, and `undefined` is returned to the sender — they never crash your service worker.

## Message Flow

```
Content Script / Popup                 Background Service Worker
       │                                        │
       │── msg.send("getUser", {id: 1}) ──────>│
       │   (chrome.runtime.sendMessage)         │
       │                                        │── handler({id: 1}, sender)
       │                                        │   returns { name: "Alice" }
       │<────────── { name: "Alice" } ──────────│
       │                                        │
       │                                        │── msg.sendTab({tabId}, "notify", {text})
       │<── handler({text}, sender) ────────────│
       │    (chrome.tabs.sendMessage)           │
```

## License

MIT

---

Built by [Zovo](https://zovo.one)
