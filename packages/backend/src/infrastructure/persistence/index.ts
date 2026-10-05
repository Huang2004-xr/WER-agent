export interface PersistenceConnection {
  readonly dialect: "postgres";
  connect(): Promise<void>;
}
