import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMessenger, sendMessage, sendTabMessage, onMessage, MessagingError } from "../src/index.js";
import type { MessageMap, Envelope } from "../src/index.js";

// ---------------------------------------------------------------------------
// Test message map
// ---------------------------------------------------------------------------

type TestMessages = {
  ping: { request: { ts: number }; response: { pong: true } };
  getUser: { request: { id: number }; response: { name: string } };
  notify: { request: { text: string }; response: void };
};

// ---------------------------------------------------------------------------
// Chrome API mocks
// ---------------------------------------------------------------------------

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

let listeners: MessageListener[] = [];

const mockChrome = {
  runtime: {
    lastError: null as { message: string } | null,
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn((fn: MessageListener) => {
        listeners.push(fn);
      }),
      removeListener: vi.fn((fn: MessageListener) => {
        listeners = listeners.filter((l) => l !== fn);
      }),
    },
  },
  tabs: {
    sendMessage: vi.fn(),
  },
};

// Expose mock as global chrome
(globalThis as Record<string, unknown>).chrome = mockChrome;

function simulateIncoming(envelope: Envelope, sender?: chrome.runtime.MessageSender) {
  const fakeSender: chrome.runtime.MessageSender = sender ?? { id: "test-extension" };
  let captured: unknown;
  const sendResponse = (r: unknown) => {
    captured = r;
  };

  let async = false;
  for (const l of listeners) {
    const ret = l(envelope, fakeSender, sendResponse);
    if (ret === true) async = true;
  }

  return { captured, async };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  listeners = [];
  vi.clearAllMocks();
  mockChrome.runtime.lastError = null;
});

describe("sendMessage", () => {
  it("resolves with the response from the callback", async () => {
    mockChrome.runtime.sendMessage.mockImplementation(
      (_msg: unknown, cb: (r: unknown) => void) => {
        cb({ pong: true });
      },
    );

    const result = await sendMessage<TestMessages, "ping">("ping", { ts: 1 });
    expect(result).toEqual({ pong: true });
  });

  it("rejects when chrome.runtime.lastError is set", async () => {
    mockChrome.runtime.sendMessage.mockImplementation(
      (_msg: unknown, cb: (r: unknown) => void) => {
        mockChrome.runtime.lastError = { message: "Could not establish connection" };
        cb(undefined);
        mockChrome.runtime.lastError = null;
      },
    );

    await expect(sendMessage<TestMessages, "ping">("ping", { ts: 1 })).rejects.toThrow(
      MessagingError,
    );
  });

  it("sends the correct envelope shape", async () => {
    mockChrome.runtime.sendMessage.mockImplementation(
      (_msg: unknown, cb: (r: unknown) => void) => {
        cb(undefined);
      },
    );

    await sendMessage<TestMessages, "ping">("ping", { ts: 42 });

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "ping", payload: { ts: 42 } },
      expect.any(Function),
    );
  });
});

describe("sendTabMessage", () => {
  it("resolves with the response", async () => {
    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: unknown, _opts: unknown, cb: (r: unknown) => void) => {
        cb({ name: "Alice" });
      },
    );

    const result = await sendTabMessage<TestMessages, "getUser">(
      { tabId: 123 },
      "getUser",
      { id: 1 },
    );
    expect(result).toEqual({ name: "Alice" });
  });

  it("passes frameId when provided", async () => {
    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: unknown, _opts: unknown, cb: (r: unknown) => void) => {
        cb(undefined);
      },
    );

    await sendTabMessage<TestMessages, "notify">(
      { tabId: 1, frameId: 0 },
      "notify",
      { text: "hi" },
    );

    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "notify", payload: { text: "hi" } },
      { frameId: 0 },
      expect.any(Function),
    );
  });

  it("rejects on chrome.runtime.lastError", async () => {
    mockChrome.tabs.sendMessage.mockImplementation(
      (_tabId: number, _msg: unknown, _opts: unknown, cb: (r: unknown) => void) => {
        mockChrome.runtime.lastError = { message: "No tab" };
        cb(undefined);
        mockChrome.runtime.lastError = null;
      },
    );

    await expect(
      sendTabMessage<TestMessages, "ping">({ tabId: 999 }, "ping", { ts: 0 }),
    ).rejects.toThrow("sendTabMessage");
  });
});

describe("onMessage", () => {
  it("dispatches to the correct handler and returns sync response", () => {
    const unsub = onMessage<TestMessages>({
      ping: (payload) => ({ pong: true }),
    });

    const { captured, async } = simulateIncoming({ type: "ping", payload: { ts: 1 } });
    expect(captured).toEqual({ pong: true });
    expect(async).toBe(false);

    unsub();
    expect(mockChrome.runtime.onMessage.removeListener).toHaveBeenCalled();
  });

  it("handles async handlers and returns true to keep channel open", async () => {
    onMessage<TestMessages>({
      getUser: async (payload) => {
        return { name: "Bob" };
      },
    });

    let resolvedResponse: unknown;
    const fakeSender: chrome.runtime.MessageSender = { id: "ext" };
    const sendResponse = (r: unknown) => {
      resolvedResponse = r;
    };

    const ret = listeners[0](
      { type: "getUser", payload: { id: 2 } },
      fakeSender,
      sendResponse,
    );

    expect(ret).toBe(true); // async
    // Wait for microtask
    await new Promise((r) => setTimeout(r, 0));
    expect(resolvedResponse).toEqual({ name: "Bob" });
  });

  it("ignores messages without envelope shape", () => {
    onMessage<TestMessages>({
      ping: () => ({ pong: true }),
    });

    const { captured } = simulateIncoming("not an envelope" as unknown as Envelope);
    expect(captured).toBeUndefined();
  });

  it("ignores messages with no matching handler", () => {
    onMessage<TestMessages>({
      ping: () => ({ pong: true }),
    });

    const { captured } = simulateIncoming({ type: "getUser", payload: { id: 1 } });
    expect(captured).toBeUndefined();
  });

  it("catches sync handler errors and sends undefined", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    onMessage<TestMessages>({
      ping: () => {
        throw new Error("boom");
      },
    });

    const { captured } = simulateIncoming({ type: "ping", payload: { ts: 0 } });
    expect(captured).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("catches async handler rejections and sends undefined", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    onMessage<TestMessages>({
      getUser: async () => {
        throw new Error("async boom");
      },
    });

    let resolvedResponse: unknown = "NOT_SET";
    const sendResponse = (r: unknown) => {
      resolvedResponse = r;
    };

    listeners[0](
      { type: "getUser", payload: { id: 1 } },
      { id: "ext" },
      sendResponse,
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(resolvedResponse).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("createMessenger", () => {
  it("provides typed send / sendTab / onMessage", async () => {
    const msg = createMessenger<TestMessages>();

    // Verify send delegates to chrome.runtime.sendMessage
    mockChrome.runtime.sendMessage.mockImplementation(
      (_msg: unknown, cb: (r: unknown) => void) => {
        cb({ pong: true });
      },
    );

    const res = await msg.send("ping", { ts: 100 });
    expect(res).toEqual({ pong: true });

    // Verify onMessage works
    const unsub = msg.onMessage({
      notify: (payload) => {
        // void handler
      },
    });
    expect(typeof unsub).toBe("function");
    unsub();
  });
});

describe("MessagingError", () => {
  it("preserves the original error", () => {
    const orig = new TypeError("oops");
    const err = new MessagingError("wrapper", orig);
    expect(err.name).toBe("MessagingError");
    expect(err.message).toBe("wrapper");
    expect(err.originalError).toBe(orig);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MessagingError);
  });
});
