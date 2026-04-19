import type { Command } from "commander";
import { runCodecCommand, parseOptionalSeed, type CommandRuntimeOptions } from "./shared.js";

export function registerSvgCommand(program: Command): void {
  program
    .command("svg")
    .argument("<prompt>", "user prompt")
    .description("Run the SVG codec (grammar-constrained LoRA engine HTTP)")
    .option("--out <path>", "output path")
    .option("--seed <number>", "seed")
    .option("--dry-run", "skip remote model / engine calls and exercise the manifest spine")
    .option("--config <path>", "config path")
    .action(async (prompt: string, options: CommandRuntimeOptions) => {
      await runCodecCommand(
        {
          modality: "svg",
          prompt,
          out: options.out,
          seed: parseOptionalSeed(options.seed),
        },
        "wittgenstein svg",
        process.argv.slice(2),
        options,
      );
    });
}
