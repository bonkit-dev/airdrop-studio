import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

export const templateManifest = [
  {
    id: "default",
    label: "Default campaign",
    templatePath: path.join(packageRoot, "templates", "default"),
  },
] as const

export function getTemplate(templateId: string) {
  const template = templateManifest.find((entry) => entry.id === templateId)

  if (!template) {
    throw new Error(`Unknown template: ${templateId}`)
  }

  return template
}
