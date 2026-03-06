---
layout: default
title: webext-messaging
---

# @theluckystrike/webext-messaging

Type-safe, promise-based message passing for Chrome extensions. Define your message types once, get full TypeScript safety everywhere.

[View on GitHub](https://github.com/theluckystrike/webext-messaging)


GETTING STARTED

Install the package.

    npm install @theluckystrike/webext-messaging

Define your message types as a TypeScript type. Each key maps a request shape to a response shape.

    type Messages = {
      getUser: { request: { id: number }; response: { name: string } };
      ping: { request: { ts: number }; response: { pong: true } };
    };

Create a messenger and wire up handlers in your background script.

    import { createMessenger } from "@theluckystrike/webext-messaging";

    const msg = createMessenger<Messages>();

    msg.onMessage({
      getUser: async ({ id }) => {
        return { name: "Alice" };
      },
    });

Send messages from content scripts or popups.

    const user = await msg.send("getUser", { id: 42 });


API REFERENCE

See the full [API docs](./api).


ABOUT

Part of the @zovo/webext toolkit by theluckystrike. Learn more at zovo.one.
