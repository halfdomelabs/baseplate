import {
  discoverGenerators,
  discoverPlugins,
} from "@halfdomelabs/project-builder-server";
import { fileURLToPath } from "node:url";

export function getDefaultPlugins(logger) {
  return discoverPlugins(fileURLToPath(import.meta.url), logger);
}

export async function getDefaultGeneratorSetupConfig(logger) {
  return discoverGenerators(fileURLToPath(import.meta.url), logger);
}
