import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "../src/runtime/harness.js";

describe("@wittgenstein/core", () => {
  it("registers the four first-class codecs", () => {
    const registry = createDefaultRegistry();
    const names = registry.list().map((codec) => codec.name).sort();
    expect(names).toEqual(["audio", "image", "sensor", "svg", "video"]);
  });
});
