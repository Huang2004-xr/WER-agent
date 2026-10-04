import { startHttpServer } from "@wer/backend";

const port = Number(process.env.PORT ?? 8787);
startHttpServer(port);
console.log(`WER API listening on http://localhost:${port}`);
