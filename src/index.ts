/**
 * @zovo/webext-messaging
 * Promise-based typed message passing for Chrome extensions.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A map from message type string to { request, response } payload shapes. */
export type MessageMap = Record<string, { request: unknown; response: unknown }>;

/** Extract the request type for a given message key. */
export type RequestOf<M extends MessageMap, K extends keyof M> = M[K]["request"];

/** Extract the response type for a given message key. */
export type ResponseOf<M extends MessageMap, K extends keyof M> = M[K]["response"];

/** The wire format sent over chrome.runtime / chrome.tabs messaging. */
export interface Envelope<M extends MessageMap = MessageMap, K extends keyof M = keyof M> {
  type: K;
  payload: M[K]["request"];
}

/** A handler function for a specific message type. */
export type Handler<M extends MessageMap, K extends keyof M> = (
  payload: RequestOf<M, K>,
  sender: chrome.runtime.MessageSender,
) => ResponseOf<M, K> | Promise<ResponseOf<M, K>>;

/** A partial map of handlers — one per message type. */
export type HandlerMap<M extends MessageMap> = {
  [K in keyof M]?: Handler<M, K>;
};

/** Options for sending a message to a specific tab. */
export interface TabMessageOptions {
  tabId: number;
  frameId?: number;
}

/** Wrapper error surfacing real messaging failures. */
export class MessagingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "MessagingError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractChromeError(): string | undefined {
  try {
    return chrome.runtime.lastError?.message;
  } catch {
    return undefined;
  }
}

function wrapError(context: string, err: unknown): MessagingError {
  if (err instanceof MessagingError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  return new MessagingError(`${context}: ${msg}`, err);
}

// ---------------------------------------------------------------------------
// Sending messages
// ---------------------------------------------------------------------------

/**
 * Send a typed message via `chrome.runtime.sendMessage`.
 * Use from content scripts, popups, or other extension pages to reach the
 * background service worker (or any other listener).
 */
export function sendMessage<M extends MessageMap, K extends keyof M & string>(
  type: K,
  payload: RequestOf<M, K>,
): Promise<ResponseOf<M, K>> {
  const envelope: Envelope<M, K> = { type, payload };

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(envelope, (response: ResponseOf<M, K>) => {
      const err = extractChromeError();
      if (err) {
        reject(new MessagingError(`sendMessage("${type}"): ${err}`));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a typed message to a specific tab via `chrome.tabs.sendMessage`.
 * Use from the background service worker to reach content scripts.
 */
export function sendTabMessage<M extends MessageMap, K extends keyof M & string>(
  options: TabMessageOptions,
  type: K,
  payload: RequestOf<M, K>,
): Promise<ResponseOf<M, K>> {
  const envelope: Envelope<M, K> = { type, payload };
  const sendOptions: chrome.tabs.MessageSendOptions = {};
  if (options.frameId !== undefined) {
    sendOptions.frameId = options.frameId;
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(options.tabId, envelope, sendOptions, (response: ResponseOf<M, K>) => {
      const err = extractChromeError();
      if (err) {
        reject(new MessagingError(`sendTabMessage("${type}", tab=${options.tabId}): ${err}`));
      } else {
        resolve(response);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Listening for messages
// ---------------------------------------------------------------------------

/**
 * Register typed message handlers. Returns an unsubscribe function.
 *
 * Handlers can be synchronous or async. If a handler returns a Promise the
 * internal `sendResponse` callback is deferred correctly (the listener
 * returns `true` to keep the message channel open).
 */
export function onMessage<M extends MessageMap>(handlers: HandlerMap<M>): () => void {
  const listener = (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ): boolean | undefined => {
    if (!isEnvelope(message)) return undefined;

    const { type, payload } = message as Envelope<M>;
    const handler = handlers[type] as Handler<M, typeof type> | undefined;
    if (!handler) return undefined;

    try {
      const result = handler(payload, sender);

      if (isPromiseLike(result)) {
        (result as Promise<unknown>)
          .then((res) => sendResponse(res))
          .catch((err) => {
            console.error(`[webext-messaging] handler "${String(type)}" rejected:`, err);
            sendResponse(undefined);
          });
        return true; // keep channel open for async response
      }

      sendResponse(result);
      return undefined;
    } catch (err) {
      console.error(`[webext-messaging] handler "${String(type)}" threw:`, err);
      sendResponse(undefined);
      return undefined;
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

// ---------------------------------------------------------------------------
// Typed messenger factory (recommended API)
// ---------------------------------------------------------------------------

export interface Messenger<M extends MessageMap> {
  /** Send a message via chrome.runtime (content script / popup -> background). */
  send<K extends keyof M & string>(type: K, payload: RequestOf<M, K>): Promise<ResponseOf<M, K>>;

  /** Send a message to a specific tab (background -> content script). */
  sendTab<K extends keyof M & string>(
    options: TabMessageOptions,
    type: K,
    payload: RequestOf<M, K>,
  ): Promise<ResponseOf<M, K>>;

  /** Register handlers. Returns an unsubscribe function. */
  onMessage(handlers: HandlerMap<M>): () => void;
}

/**
 * Create a fully-typed messenger bound to a specific `MessageMap`.
 *
 * ```ts
 * const msg = createMessenger<MyMessages>();
 * const data = await msg.send("getUser", { id: 1 });
 * ```
 */
export function createMessenger<M extends MessageMap>(): Messenger<M> {
  return {
    send: <K extends keyof M & string>(type: K, payload: RequestOf<M, K>) =>
      sendMessage<M, K>(type, payload),

    sendTab: <K extends keyof M & string>(
      options: TabMessageOptions,
      type: K,
      payload: RequestOf<M, K>,
    ) => sendTabMessage<M, K>(options, type, payload),

    onMessage: (h: HandlerMap<M>) => onMessage<M>(h),
  };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as Envelope).type === "string" &&
    "payload" in value
  );
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}
