import { describe, it, expect, vi } from "vitest";

import { mutate, select } from "../src";

describe("basic select", () => {
  it("select exactly the modified value", () => {
    const state = {
      observeMe: "hello",
    };

    const callbackSpy = vi.fn();
    const callbackSpy2 = vi.fn();
    const mapperSpy = vi.fn();

    const mapper = (currentState) => {
      mapperSpy();
      return {
        someValue: currentState.observeMe,
        somethingElse: "this",
      };
    };

    select(state, ["/observeMe"], (currentState) => {
      const result = mapper(currentState);
      callbackSpy(result);
      return result;
    });

    select(state, ["/observeMe"], (currentState) => {
      const result = mapper(currentState);
      callbackSpy2(result);
      return result;
    });

    mutate(state, (modifiable) => {
      modifiable.observeMe = "changed";
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy2).toHaveBeenCalledTimes(1);

    expect(callbackSpy.mock.calls[0][0]).toEqual({
      someValue: "changed",
      somethingElse: "this",
    });
    expect(callbackSpy2.mock.calls[0][0]).toEqual({
      someValue: "changed",
      somethingElse: "this",
    });
    expect(mapperSpy).toHaveBeenCalledTimes(2);
  });

  it("select triggers only on relevant path", () => {
    const state = {
      observeMe: "hello",
      iDontCare: "should not trigger",
    };

    const callbackSpyThatShouldRun = vi.fn();
    const callbackSpyThatShouldNotRun = vi.fn();
    const mapperSpyThatShouldRun = vi.fn();
    const mapperSpyThatShouldNotRun = vi.fn();

    select(state, ["/observeMe"], (currentState) => {
      mapperSpyThatShouldRun();
      const result = {
        someValue: currentState.observeMe,
        somethingElse: "this",
      };
      callbackSpyThatShouldRun(result);
      return result;
    });

    select(state, ["/iDontCare"], (currentState) => {
      mapperSpyThatShouldNotRun();
      const result = {
        someValue: currentState.iDontCare,
        somethingElse: "this",
      };
      callbackSpyThatShouldNotRun(result);
      return result;
    });

    mutate(state, (modifiable) => {
      modifiable.observeMe = "changed";
    });

    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(1);
    expect(callbackSpyThatShouldNotRun).toHaveBeenCalledTimes(0);
    expect(callbackSpyThatShouldRun.mock.calls[0][0]).toEqual({
      someValue: "changed",
      somethingElse: "this",
    });
    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(1);
    expect(mapperSpyThatShouldNotRun).toHaveBeenCalledTimes(0);
  });

  it("select support multple paths", () => {
    const state = {
      observeMe: "something",
      observeMeToo: "i am here",
      dontObserveMe: "i am not supposed to be observed",
    };

    const callbackSpyThatShouldRun = vi.fn();
    const mapperSpyThatShouldRun = vi.fn();

    select(state, ["/observeMe", "/observeMeToo"], (currentState) => {
      mapperSpyThatShouldRun();
      const result = {
        someValue: currentState.observeMe,
        somethingElse: "this",
      };
      callbackSpyThatShouldRun(result);
      return result;
    });

    mutate(state, (modifiable) => {
      modifiable.dontObserveMe = "changed";
    });

    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(0);

    mutate(state, (modifiable) => {
      modifiable.observeMe = "hello";
    });

    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(1);
    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(1);
    expect(callbackSpyThatShouldRun.mock.calls[0][0]).toEqual({
      someValue: "hello",
      somethingElse: "this",
    });

    mutate(state, (modifiable) => {
      modifiable.observeMeToo = "hello too";
    });

    expect(mapperSpyThatShouldRun).toHaveBeenCalledTimes(2);
    expect(callbackSpyThatShouldRun).toHaveBeenCalledTimes(2);
    expect(callbackSpyThatShouldRun.mock.calls[1][0]).toEqual({
      someValue: "hello",
      somethingElse: "this",
    });
  });

  it("support unsubing from subscriptions", () => {
    const state = {
      observeMe: "something",
    };

    const callbackSpy = vi.fn();
    const callbackSpy2 = vi.fn();

    const subscription1 = select(state, ["/observeMe"], (currentState) => {
      const result = {
        someValue: currentState.observeMe,
      };
      callbackSpy(result);
      return result;
    });

    const subscription2 = select(state, ["/observeMe"], (currentState) => {
      const result = {
        someValue: currentState.observeMe,
      };
      callbackSpy2(result);
      return result;
    });

    const unsub1 = subscription1.dispose;
    const unsub2 = subscription2.dispose;

    mutate(state, (modifiable) => {
      modifiable.observeMe = "hello";
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy2).toHaveBeenCalledTimes(1);

    unsub1();
    mutate(state, (modifiable) => {
      modifiable.observeMe = "hello again";
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy2).toHaveBeenCalledTimes(2);

    unsub2();
    mutate(state, (modifiable) => {
      modifiable.observeMe = "hello again";
    });

    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy2).toHaveBeenCalledTimes(2);
  });

  it("can run multiple identical selectors", () => {
    const state = {
      key1: "something",
    };

    const callback1 = vi.fn();
    select(state, ["/key1"], (currentState) => {
      const result = {
        someValue: currentState.key1,
      };
      callback1(result);
      return result;
    });

    const callback2 = vi.fn();
    select(state, ["/key1"], (currentState) => {
      const result = {
        someValue: currentState.key1,
      };
      callback2(result);
      return result;
    });

    mutate(state, (mutable) => {
      mutable.key1 = "changed";
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
