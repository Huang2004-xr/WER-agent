import type { ExternalPlatformConnector } from "./platform-connector.js";

export class HttpPlatformClient implements ExternalPlatformConnector {
  public constructor(
    public readonly platform: string,
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async search(query: string, options?: { readonly signal?: AbortSignal }): Promise<readonly string[]> {
    const url = new URL("/search", this.baseUrl);
    url.searchParams.set("q", query);
    const response = await this.fetcher(url, options?.signal ? { signal: options.signal } : undefined);
    if (!response.ok) throw new Error(`${this.platform} search failed with status ${response.status}`);
    const body = (await response.json()) as { results?: unknown };
    return Array.isArray(body.results) ? body.results.filter((item): item is string => typeof item === "string") : [];
  }
}
