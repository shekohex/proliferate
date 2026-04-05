# @coder/sdk

This package provides the TypeScript SDK for interacting with the Coder API.

## Origin

The code in this package is approximately **95% copied and adapted** from the original [Coder codebase](https://github.com/coder/coder/tree/main/site/src/api).

## Adaptations

While the core logic remains faithful to the upstream implementation, we have made several key adaptations to suit our specific use-case:

- **Migration to Native Fetch**: Replaced `axios` with the native `fetch` API to minimize dependencies and improve compatibility across different JavaScript environments (Web, Node.js, Bun).
- **Dependency Pruning**: Removed heavy dependencies such as `lodash`, `dayjs`, `ua-parser-js`, and `@tanstack/react-query`.
- **Bun Support**: Optimized for the [Bun](https://bun.sh) runtime and test runner.
- **Enhanced Type Safety**: Refined TypeScript definitions and eliminated many `any` types in favor of more robust type assertions.
