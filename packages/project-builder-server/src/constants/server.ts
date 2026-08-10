export const DEFAULT_SERVER_PORT = 4400;

/**
 * Parses an environment variable as a base-10 integer, ignoring missing or
 * malformed values.
 */
function parseEnvInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Resolves the port for the project builder web server.
 *
 * Precedence: explicit `port` > `BASEPLATE_PORT` > `DEFAULT_SERVER_PORT` plus
 * `PORT_OFFSET`. `BASEPLATE_PORT` is absolute and ignores `PORT_OFFSET`.
 *
 * @param port - Port supplied via the `--port` flag.
 * @returns The port to listen on.
 */
export function resolveServerPort({ port }: { port?: number } = {}): number {
  const envPort = parseEnvInt(process.env.BASEPLATE_PORT);
  const portOffset = parseEnvInt(process.env.PORT_OFFSET) ?? 0;

  return port ?? envPort ?? DEFAULT_SERVER_PORT + portOffset;
}
