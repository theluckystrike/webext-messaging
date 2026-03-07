# @theluckystrike/webext-messaging

Type-safe, promise-based message passing for Chrome extensions. Define your message types once, get full TypeScript safety across background scripts, content scripts, popups, and extension pages.


INSTALL

npm install @theluckystrike/webext-messaging


QUICK START

Define your message map as a TypeScript type. Each key maps a request payload to a response payload.

type Messages = {
  getUser: { request: { id: number }; response: { name: string; email: string } };
  ping: { request: { ts: number }; response: { pong: true } };
  notify: { request: { text: string }; response: void };
};

Create a messenger and start using it.

// Background service worker
import { createMessenger } from "@theluckystrike/webext-messaging";

const msg = createMessenger<Messages>();

msg.onMessage({
  getUser: async ({ id }) => {
    const user = await db.getUser(id);
    return { name: user.name, email: user.email };
  },
  ping: ({ ts }) => ({ pong: true }),
});

// Content script or popup
const msg = createMessenger<Messages>();
const user = await msg.send("getUser", { id: 42 });

// Background to a specific tab
await msg.sendTab({ tabId: 123 }, "notify", { text: "Hello" });


API

createMessenger()

Returns a Messenger object with three methods.

  send(type, payload)           Sends a message via chrome.runtime.sendMessage.
                                Use from content scripts, popups, or extension pages.
                                Returns a Promise with the typed response.

  sendTab(options, type, payload)   Sends a message via chrome.tabs.sendMessage.
                                    Use from background to reach content scripts.
                                    Options take tabId (required) and frameId (optional).

  onMessage(handlers)           Registers a handler map. Each handler receives the
                                request payload and a MessageSender object. Handlers
                                can be sync or async. Returns an unsubscribe function.


Lower-Level Functions

If you prefer individual functions over the messenger object, these are also exported.

  sendMessage(type, payload)              Same as messenger.send
  sendTabMessage(options, type, payload)  Same as messenger.sendTab
  onMessage(handlers)                     Same as messenger.onMessage


Types

  MessageMap          Base type for defining your message contract
  RequestOf<M, K>     Extracts the request type for a given message key
  ResponseOf<M, K>    Extracts the response type for a given message key
  Envelope<M, K>      The wire format sent over the Chrome messaging channel
  Handler<M, K>       Function signature for a single message handler
  HandlerMap<M>       Partial map of handlers keyed by message type
  TabMessageOptions   Object with tabId and optional frameId
  Messenger<M>        The object returned by createMessenger


ERROR HANDLING

When chrome.runtime.lastError is set after a message send, the library wraps it in a MessagingError and rejects the promise. MessagingError extends Error and exposes an originalError property with the underlying Chrome error.

  import { MessagingError } from "@theluckystrike/webext-messaging";

  try {
    await msg.send("getUser", { id: 42 });
  } catch (err) {
    if (err instanceof MessagingError) {
      console.error(err.message, err.originalError);
    }
  }


MESSAGE FLOW

Content scripts and popups use send() to reach the background service worker. The background uses sendTab() to reach content scripts in a specific tab. All communication is routed through chrome.runtime messaging.

  Content Script  --send-->  Background  --sendTab-->  Content Script (tab)
  Popup           --send-->  Background


LICENSE

MIT


ABOUT

Part of the @zovo/webext toolkit. Built by theluckystrike at zovo.one, a studio for Chrome extensions and browser tools.

https://github.com/theluckystrike/webext-messaging


Part of the **[Chrome Extension Toolkit](https://github.com/theluckystrike/chrome-extension-toolkit)** by theluckystrike. See all templates, packages, and guides at [github.com/theluckystrike/chrome-extension-toolkit](https://github.com/theluckystrike/chrome-extension-toolkit).
