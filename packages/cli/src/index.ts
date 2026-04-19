import { Command } from "commander";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { registerInitCommand } from "./commands/init.js";
import { registerImageCommand } from "./commands/image.js";
import { registerAudioCommand } from "./commands/audio.js";
import { registerVideoCommand } from "./commands/video.js";
import { registerSensorCommand } from "./commands/sensor.js";
import { registerSvgCommand } from "./commands/svg.js";
import { registerDoctorCommand } from "./commands/doctor.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("wittgenstein")
    .description("Wittgenstein modality harness CLI")
    .version("0.0.0");

  registerInitCommand(program);
  registerImageCommand(program);
  registerAudioCommand(program);
  registerVideoCommand(program);
  registerSensorCommand(program);
  registerSvgCommand(program);
  registerDoctorCommand(program);

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

const isMain = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMain) {
  void runCli();
}
