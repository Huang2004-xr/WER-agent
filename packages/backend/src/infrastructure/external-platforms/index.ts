export interface ExternalPlatformConnector { readonly platform: string; search(query: string): Promise<readonly string[]>; }
