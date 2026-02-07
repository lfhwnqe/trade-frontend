import Link from "next/link";
import { DocsShell } from "../_components/docs-shell";
import { docsNav } from "../_components/docs-data";

const toc = [
  { title: "你将完成什么", href: "#goal", level: 2 as const },
  { title: "步骤 1：打开集成中心", href: "#step-1", level: 2 as const },
  { title: "步骤 2：创建 API Token", href: "#step-2", level: 2 as const },
  { title: "步骤 3：创建 Webhook", href: "#step-3", level: 2 as const },
  { title: "步骤 4：绑定 Telegram 群", href: "#step-4", level: 2 as const },
  { title: "步骤 5：发送一次测试触发", href: "#step-5", level: 2 as const },
] as const;

export default function GetStartedDocPage() {
  return (
    <DocsShell
      title="快速开始（集成指引一条龙）"
      description="3~5 分钟跑通：TradingView/Webhook → Telegram 群 →（可选）用 API Token 写入交易。"
      nav={docsNav}
      toc={[...toc]}
    >
      <section id="goal">
        <p>
          本页是最短上手路径。完成后你会得到：
          <strong>一个可触发的 Webhook URL</strong>
          （TradingView 友好，无需额外 header），并把消息推送到你指定的 Telegram 群。
        </p>
      </section>

      <section id="step-1">
        <h2>步骤 1：打开集成中心</h2>
        <p>
          进入 Trade 页面，左侧栏底部点击 <strong>开发者工具</strong>，会弹出
          <strong>集成中心</strong> 抽屉。
        </p>
      </section>

      <section id="step-2">
        <h2>步骤 2：创建 API Token（可选）</h2>
        <p>
          进入 <Link href="/trade/tokens">API Token</Link> 页面创建 Token。
          Token 以 <code>tc_</code> 开头，创建时明文只返回一次，请保存。
        </p>
        <p>
          详细说明见：<Link href="/docs/api-token">API Token 使用指南</Link>。
        </p>
      </section>

      <section id="step-3">
        <h2>步骤 3：创建 Webhook</h2>
        <p>
          进入 <Link href="/trade/webhook">Webhook</Link> 创建一个 hook。
          你会拿到 <code>triggerUrl</code>（触发用）和 <code>bindCode</code>
          （绑定群用）。
        </p>
      </section>

      <section id="step-4">
        <h2>步骤 4：绑定 Telegram 群</h2>
        <p>
          把机器人拉进目标 Telegram 群，在群内发送：<code>/bind &lt;bindCode&gt;</code>。
        </p>
        <p>
          绑定成功后，这个 hook 的触发消息会推送到该群。
        </p>
      </section>

      <section id="step-5">
        <h2>步骤 5：发送一次测试触发</h2>
        <p>
          在 Webhook 页面点“测试触发”，或直接请求前端代理：
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-white whitespace-pre">
{`curl -X POST "https://<YOUR_FRONTEND_ORIGIN>/api/webhook?token=tw_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello from webhook"}'`}
        </pre>
        <p>
          如果触发过快，会被限流（每 hook 1 分钟 1 次）。
        </p>
        <p>
          详细说明见：<Link href="/docs/webhook">Webhook 使用指南</Link>。
        </p>
      </section>

      <hr />
      <p>
        Next steps：
        <Link href="/docs/webhook">配置 TradingView Alert</Link>
        ，或使用
        <Link href="/docs/api-token">API Token</Link>
        直接把交易写进系统。
      </p>
    </DocsShell>
  );
}
