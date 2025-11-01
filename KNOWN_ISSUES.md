# Known Issues and Bugs

This document tracks known issues, bugs, and areas needing improvement in the proxy-live-document library.

## Status Legend
- ✅ **Fixed** - Issue has been resolved
- 🔴 **Bug** - Confirmed bug that needs fixing
- ⚠️ **Limitation** - Known limitation or edge case
- 📝 **Won't Fix** - Intentional decision not to fix

---

## 1. Reshape Functionality - ✅ Fixed

**Status**: Fixed in v3.0.0

**Previous Location**: `src/index.ts:1256-1258`

**Resolution**: The `reshape()` method has been **removed completely** in v3.0.0 as part of breaking changes.

**Actions Completed**:
- ✅ Removed `reshape()` method from selector return object
- ✅ Deleted failing test at `tests/basic-select.test.ts:209-284`
- ✅ Updated documentation (CLAUDE.md, readme.md) to reflect removal
- ✅ TypeScript definitions will be regenerated on build

**Migration Path**: Applications can achieve the same result by:
1. Calling `dispose()` on the existing selector
2. Creating a new selector with updated paths
3. Binding the same callback

---

## 2. Array `splice()` with Remove+Add - 🔴 Bug

**Status**: Bug (Needs Fix)

**Location**: Array proxy handler for `splice()` method

**Issue**: When `splice()` is called with both remove and add operations (e.g., `array.splice(1, 1, 'new', 'items')`), the generated patches only include the removal operation, not the additions.

**Test**: `tests/array/splice-replace.test.ts:48` (newly created, failing)

**Example**:
```javascript
const state = { words: ['hello', 'world', '!'] }
mutate(state, (modifiable) => {
  modifiable.words.splice(1, 1, 'beautiful', 'day')
})
// Result: ['hello', 'beautiful', 'day', '!']
// Patches generated: Only shows removal of 'world', missing additions
```

**Impact**:
- Patches cannot be replayed correctly with `mutateFromPatches()`
- State synchronization across clients would be incorrect
- Undo/redo functionality would be broken

**Root Cause**: The array proxy handler likely only handles the removal part of splice, not the insertion part

**Recommended Action**:
- Investigate `ProxyMutationArrayHandler` in `src/index.ts`
- Ensure `splice()` generates patches for both removes AND adds
- Test with various splice scenarios (remove only, add only, remove+add)

---

## 3. Array Method Support - ⚠️ Limitation

**Status**: Incomplete Implementation

**Methods Tested and Working**:
- ✅ `push()` - Generates correct patches
- ✅ `pop()` - Generates correct patches
- ✅ `shift()` - Generates correct patches
- ✅ `unshift()` - Generates correct patches
- ✅ Direct index assignment (`arr[0] = value`) - Works
- ✅ Array replacement (`state.arr = newArray`) - Works
- ⚠️ `delete arr[index]` - Works but replaces with `undefined` (array doesn't shrink)

**Methods Potentially Problematic** (Not yet tested):
- ❓ `splice()` with remove+add - **CONFIRMED BUG** (see issue #2)
- ❓ `reverse()` - Created test, needs verification
- ❓ `sort()` - Created test, needs verification
- ❓ `fill()` - Not tested
- ❓ `copyWithin()` - Not tested

**Test Coverage**: `tests/array/basic.test.ts` and `tests/array/splice-replace.test.ts`

**Recommended Action**:
- Run the new `splice-replace.test.ts` tests for `reverse()` and `sort()`
- Create comprehensive test suite for all array mutating methods
- Document which array methods are supported vs unsupported
- Consider warning users about unsupported methods in documentation

---

## 4. Test Suite Issues

### 4.1 `describe.only` Found - ✅ Fixed

**Location**: `tests/mutate-patch-order.test.ts:26`

**Issue**: Had `describe.only()` which was masking other test failures

**Status**: Fixed - changed to `describe()`

### 4.2 Deprecated `observe()` API - ✅ Fixed

**Status**: Fixed in v3.0.0

**Previous Location**: `src/index.ts:1259-1267`

**Resolution**: The `observe()` method has been **removed completely** in v3.0.0 as part of breaking changes.

**Actions Completed**:
- ✅ Removed `observe()` method from selector return object
- ✅ Migrated all 18 test usages across 5 test files to use separate `select()` calls
- ✅ Updated documentation (CLAUDE.md, readme.md) with migration guide
- ✅ No more deprecation warnings in test output

**Migration Pattern**: Replace `selector.observe(callback)` with separate `select(state, paths, callback)` calls

---

## 5. Array `delete` Operator Behavior - ⚠️ Limitation

**Status**: Known Limitation (Documented in tests)

**Location**: `tests/array/basic.test.ts:220-257`

**Issue**: Using `delete` on an array element replaces it with `undefined` but doesn't shrink the array

**Comment from code**:
```javascript
// BEWARE. Remove here replaces with undefined actually. For arrays it is
// very different! The array DOES NOT SHRINK! My intution would be that it
// should be a replace with undefined not a remove, but it would require
// implementing a different mutation logic for arrays.
```

**Current Behavior**:
- Generates a `remove` operation patch
- Array maintains same length but has `undefined` at deleted index

**Expected Behavior** (arguably):
- Should generate a `replace` with `undefined` patch
- Or implement proper array shrinking

**Recommended Action**:
- Document this limitation clearly in README
- Recommend using `splice()` instead of `delete` for arrays
- Consider if this behavior should be changed in a major version

---

## 6. Security Vulnerabilities in Dependencies

**Status**: Non-critical (Development dependencies)

**Issue**: `npm audit` reports 15 vulnerabilities (1 low, 6 moderate, 7 high, 1 critical)

**Impact**: Development dependencies only, doesn't affect production builds

**Recommended Action**:
- Review `npm audit` output
- Update dependencies where possible
- Document any dependencies that can't be updated safely

---

## Summary

### Critical Issues (Need Immediate Attention)
1. Array `splice()` with remove+add - Breaks patch replay

### Medium Priority
1. Test and document all array method support
2. ~~Remove or document reshape functionality~~ ✅ **Completed in v3.0.0**
3. ~~Migrate away from deprecated `observe()` API~~ ✅ **Completed in v3.0.0**

### Low Priority
1. Array `delete` operator behavior documentation
2. Dependency updates
3. Remove test artifacts (`describe.only`, skipped tests)

---

## Test Execution Status

Last run: 2025-11-01

**Before cleanup**:
- Test Files: 2 failed | 21 passed (23)
- Tests: 2 failed | 121 passed (123)
- Failing: reshape test, splice-replace test

**Action Items**:
1. ~~Remove or unskip reshape test per decision~~ ✅ **Completed in v3.0.0**
2. Fix array splice bug OR document as unsupported
3. Verify `reverse()` and `sort()` test results

**v3.0.0 Update**:
- Removed `reshape()` method and failing test
- Removed `observe()` method and migrated all test usages
- Expected test status after changes: 1 failing test (array splice bug only)
