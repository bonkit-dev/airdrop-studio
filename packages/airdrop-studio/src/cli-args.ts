export type CliArgs = {
  workspacePath?: string
  help: boolean
  version: boolean
}

export function parseCliArgs(rawArgs: string[]): CliArgs {
  const result: CliArgs = {
    help: false,
    version: false,
  }

  for (const arg of rawArgs) {
    if (arg === "--") continue
    if (arg === "--help" || arg === "-h") {
      result.help = true
      continue
    }
    if (arg === "--version" || arg === "-v") {
      result.version = true
      continue
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`)
    }
    result.workspacePath ??= arg
  }

  return result
}
