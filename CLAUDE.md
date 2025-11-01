# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **proxy-live-document**, a mutable state management library with fine-grained reactivity and automatic JSON Patch generation. It's designed for real-time collaboration and undo/redo functionality by tracking changes as RFC 6902 JSON Patches.

**Current Status**: Version 3.0.0 - Major version with breaking changes (removed deprecated APIs).

## Development Commands

### Build and Test
- `npm run build` - Build production bundle using Rollup (outputs to `dist/`)
- `npm run test` - Run all tests using Vitest 
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Build Process
- Uses Rollup with TypeScript plugin and Terser for minification
- Outputs both CommonJS (`dist/index.main.js`) and ES modules (`dist/index.module.js`)
- TypeScript declarations generated to `dist/index.d.ts`

## Core Architecture

### Main Entry Point
- `src/index.ts` - Main library export containing all public APIs

### Key Components

#### Mutation System (`src/index.ts`)
- **MutationsManager** - Orchestrates all mutations and proxy creation
- **mutate()** - Primary API for creating transactional state changes
- **ProxyMutationObjectHandler** & **ProxyMutationArrayHandler** - Proxy handlers that intercept and track changes
- **mutateFromPatches()** - Apply pre-generated JSON Patches to state

#### Selector System (`src/selector-map.ts`)
- **select()** - Subscribe to specific state paths using JSON Pointer syntax
- **autorun()** - Automatic dependency tracking (like MobX autorun)
- **SelectorTreeBranch** - Tree structure for managing subscriptions
- Supports glob patterns: `*` (any direct child), `**` (any descendant)

#### Mutation Tracking (`src/mutation-map.ts`)
- **MutationTreeNode** - Tree structure tracking all changes in a transaction
- **getPatchesFromMutationTree()** - Convert mutation tree to JSON Patches
- Handles operation merging and conflict resolution

#### Proxy Caching (`src/proxy-cache.ts`)
- **ProxyCache** - WeakSet-based caching to prevent duplicate proxies

### Array Support Limitations
Arrays have **limited support**. Basic operations work (push, pop, shift, splice with simple cases), but complex array methods may not generate correct patches. The library encourages using object maps instead of arrays for better support.

### State Path Patterns
- `/user/name` - Exact path
- `/todos/*` - Any direct child of todos  
- `/todos/**` - Any descendant of todos (any depth)
- `/todos/*/done` - The `done` property of any todo

## Testing

- Uses Vitest as test runner with TypeScript support
- Test files located in `tests/` directory with comprehensive coverage
- Includes tests for mutations, selectors, array operations, and edge cases
- Configuration in `vitest/vitest.config.ts`

## Key Implementation Notes

### Transactional Mutations
All changes within a `mutate()` callback are batched and atomic. If an error occurs, changes are rolled back.

### Fine-grained Reactivity  
Only selectors matching changed paths are triggered, enabling efficient UI updates.

### JSON Patch Generation
Every mutation returns RFC 6902 compliant patches with enhanced metadata (path arrays, old values) for undo/redo and synchronization.

### Class Instance Support
Works with both plain objects and class instances. Classes can implement `IObservableDomain` interface for custom serialization.

## Breaking Changes in v3.0.0
- **Removed `reshape()` method** - Create a new selector instead of trying to reshape an existing one
- **Removed `observe()` method** - Use separate `select()` calls for multiple observers on the same state path