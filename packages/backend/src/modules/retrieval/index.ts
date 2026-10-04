export interface RetrievalResult { readonly source: string; readonly content: string; readonly score: number; }
export interface Retriever { search(query: string): Promise<readonly RetrievalResult[]>; }

export class EmptyRetriever implements Retriever {
  async search(_query: string): Promise<readonly RetrievalResult[]> { return []; }
}
