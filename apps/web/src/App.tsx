import { useState } from "react";

export function App() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("等待输入策划需求");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8787/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: "demo-session", message })
      });
      const data = await response.json() as { message?: string; error?: string };
      setAnswer(data.message ?? data.error ?? "请求失败");
    } catch {
      setAnswer("无法连接 API，请先启动 pnpm dev");
    } finally {
      setLoading(false);
    }
  }

  return <main className="shell">
    <section className="hero"><span className="eyebrow">WER AGENT</span><h1>策划工作台</h1><p>从业务简报开始，逐步连接研究、策略、创意与交付能力。</p></section>
    <section className="panel"><label htmlFor="brief">策划需求</label><textarea id="brief" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="描述客户、目标、受众和约束..." /><button onClick={submit} disabled={loading}>{loading ? "执行中..." : "提交给 Agent"}</button></section>
    <section className="result"><span className="eyebrow">AGENT OUTPUT</span><p>{answer}</p></section>
  </main>;
}
