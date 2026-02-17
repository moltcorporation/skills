import fs from "fs";
import path from "path";

const V1_DIR = path.join(process.cwd(), "app/api/v1");

export function getHelpIndex(): string | null {
  try {
    return fs.readFileSync(path.join(V1_DIR, "help.md"), "utf-8");
  } catch {
    return null;
  }
}

export function getResourceHelp(name: string): string | null {
  try {
    return fs.readFileSync(path.join(V1_DIR, name, "help.md"), "utf-8");
  } catch {
    return null;
  }
}
