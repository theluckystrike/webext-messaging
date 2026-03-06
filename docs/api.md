---
layout: default
title: API Reference
---

# API Reference


createMessenger()

Creates a typed Messenger instance. The type parameter M defines your message contract.

    import { createMessenger } from "@theluckystrike/webext-messaging";

    type Messages = {
      ping: { request: { ts: number }; response: { pong: true } };
    };

    const msg = createMessenger<Messages>();

Returns a Messenger object with three methods described below.


Messenger.send(type, payload)

Sends a message via chrome.runtime.sendMessage. Use this from content scripts, popups, and extension pages to communicate with the background service worker.

    const response = await msg.send("ping", { ts: Date.now() });

Returns a Promise that resolves with the typed response. Rejects with MessagingError if chrome.runtime.lastError is set.


Messenger.sendTab(options, type, payload)

Sends a message via chrome.tabs.sendMessage. Use this from the background to reach content scripts in a specific tab.

    await msg.sendTab({ tabId: 123 }, "ping", { ts: Date.now() });

    // With frameId
    await msg.sendTab({ tabId: 123, frameId: 0 }, "ping", { ts: Date.now() });


Messenger.onMessage(handlers)

Registers handlers for incoming messages. Each handler receives the request payload and a chrome.runtime.MessageSender object. Handlers can be synchronous or async.

    const unsubscribe = msg.onMessage({
      ping: ({ ts }, sender) => {
        console.log("ping from", sender.tab?.id, "at", ts);
        return { pong: true };
      },
    });

    // Stop listening
    unsubscribe();

Returns an unsubscribe function.


MessagingError

Custom error class for Chrome messaging failures. Extends Error and adds an originalError property.

    import { MessagingError } from "@theluckystrike/webext-messaging";

    try {
      await msg.send("ping", { ts: Date.now() });
    } catch (err) {
      if (err instanceof MessagingError) {
        console.error(err.originalError);
      }
    }


Standalone Functions

These are also exported if you prefer functions over the messenger object.

    sendMessage(type, payload)              Same as Messenger.send
    sendTabMessage(options, type, payload)   Same as Messenger.sendTab
    onMessage(handlers)                      Same as Messenger.onMessage


Types

    MessageMap            Base type for message contracts
    RequestOf<M, K>       Request type for a given key
    ResponseOf<M, K>      Response type for a given key
    Envelope<M, K>        Wire format { type, payload }
    Handler<M, K>         Single handler function signature
    HandlerMap<M>         Partial map of handlers
    TabMessageOptions     { tabId: number; frameId?: number }
    Messenger<M>          Full messenger interface


Back to [home](./).
