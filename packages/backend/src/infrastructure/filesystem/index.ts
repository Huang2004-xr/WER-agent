export interface ObjectStorage { put(key: string, content: Uint8Array): Promise<string>; }
