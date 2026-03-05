# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-??-??

### Added

- Initial release: promise-based typed message passing for Chrome extensions
- `createMessenger<M>()` - Main API for creating typed messengers
- `sendMessage<M, K>()` - Send messages from content scripts/popups to background
- `sendTabMessage<M, K>()` - Send messages from background to content scripts
- `onMessage<M>()` - Register typed message handlers
- `MessagingError` - Custom error class that wraps `chrome.runtime.lastError`
- Full TypeScript type support for request/response types
- Support for both sync and async handlers

### Features

- Type-safe message passing between background, content scripts, and popups
- Proper error handling - errors are caught and logged rather than silently swallowed
- Tab-specific messaging with support for frameId
- MIT licensed
