export interface PersistenceConnection { readonly dialect: "memory" | "mysql" | "postgres"; connect(): Promise<void>; }
