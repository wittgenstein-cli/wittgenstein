import { svgCodec } from "@wittgenstein/codec-svg";
import type { CodecRegistry } from "../runtime/registry.js";

export function registerSvgCodec(registry: CodecRegistry): CodecRegistry {
  registry.register(svgCodec);
  return registry;
}
