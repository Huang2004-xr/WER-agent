import { randomUUID } from "node:crypto";

export interface IdGenerator {
  next(): string;
}

export class UuidIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
