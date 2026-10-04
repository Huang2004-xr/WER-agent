import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ObjectStorage } from "./object-storage.js";

export class LocalObjectStorage implements ObjectStorage {
  public constructor(private readonly rootDirectory: string) {}

  async put(key: string, content: Uint8Array): Promise<string> {
    const path = resolve(this.rootDirectory, key);
    const root = resolve(this.rootDirectory);
    if (path !== root && !path.startsWith(`${root}/`)) throw new Error("object key escapes storage root");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    return path;
  }
}
