export interface ExternalPlatformConnector {
  readonly platform: string;
  search(query: string, options?: { readonly signal?: AbortSignal }): Promise<readonly string[]>;
}
