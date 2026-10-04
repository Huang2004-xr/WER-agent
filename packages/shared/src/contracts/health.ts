export interface HealthResponse {
  readonly status: "ok";
  readonly service: string;
  readonly version: string;
}
