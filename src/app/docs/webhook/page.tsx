import Link from "next/link";
import { DocsShell } from "../_components/docs-shell";
import { docsNav } from "../_components/docs-data";

const toc = [
  { title: "创建 Webhook", href: "#create", level: 2 as const },
  { title: "绑定 Telegram 群", href: "#bind", level: 2 as const },
  { title: "触发方式（推荐：前端代理）", href: "#trigger", level: 2 as const },
  { title: "限流说明", href: "#rate-limit", level: 2 as const },
  { title: "后端直连触发接口", href: "#backend-endpoint", level: 2 as const },
  { title: "Legacy 接口", href: "#legacy", level: 2 as const },
  { title: "对应 Skill", href: "#skill", level: 2 as const },
] as const;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-white whitespace-pre">
      {children}
    </pre>
  );
}

export default function WebhookDocPage() {
  return (
    <DocsShell
      title="Webhook 使用指南（TradingView → Telegram 群）"
      description="一个 hook 对应一个 Telegram 群：创建 → 绑定 → 触发 → 推送到群。"
      nav={docsNav}
      toc={[...toc]}
    >
      <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
        <div className="font-semibold text-white">核心模型</div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>每个 hook 都会生成一个唯一触发 URL（无需额外 header）。</li>
          <li>
            每个 hook 绑定一个 Telegram 群：群内发送 <code>/bind &lt;bindCode&gt;</code>。
          </li>
          <li>
            防滥用：每个 hook 限流 <code>1 分钟最多 1 次</code>。
          </li>
        </ul>
      </div>

      <section id="create">
        <h2>创建 Webhook</h2>
        <p>
          登录后进入 <strong>Trade → 开发者工具 → 集成中心 → Webhook</strong> 创建 hook。
          创建成功后会拿到：<code>triggerUrl</code>、<code>bindCode</code> 等。
        </p>
      </section>

      <section id="bind">
        <h2>绑定 Telegram 群</h2>
        <p>把机器人拉进目标 Telegram 群，在群里发送：</p>
        <CodeBlock>{`/bind <bindCode>`}</CodeBlock>
      </section>

      <section id="trigger">
        <h2>触发方式（推荐：前端代理 URL）</h2>
        <p>
          推荐使用前端代理（更稳定，也避免暴露后端真实 base URL）：
          <code>POST /api/webhook?token=tw_xxx</code>
        </p>
        <CodeBlock>{`curl -X POST "https://<YOUR_FRONTEND_ORIGIN>/api/webhook?token=tw_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"BTC breakout, log a new trade."}'`}</CodeBlock>
      </section>

      <section id="rate-limit">
        <h2>限流说明</h2>
        <p>
          每个 hook 限流：1 分钟最多触发 1 次。如果触发过快，接口会返回 delivered=false，并给出 nextInMs。
        </p>
      </section>

      <section id="backend-endpoint">
        <h2>后端触发接口（直连）</h2>
        <CodeBlock>{`POST https://<YOUR_API_BASE>/webhook/trade-alert/:triggerToken\nBody: { "message": "..." }\n(无需额外 header)`}</CodeBlock>
      </section>

      <section id="legacy">
        <h2>Legacy 接口（兼容旧模式）</h2>
        <CodeBlock>{`POST https://<YOUR_API_BASE>/webhook/trade-alert/hook/:hookId\nHeader: x-webhook-secret: <secret>`}</CodeBlock>
      </section>

      <section id="skill">
        <h2>对应 Skill（规格/文档维护）</h2>
        <p>
          Webhook 相关接口/字段变更建议同步维护 specs 文档，并用 OpenClaw skill <code>trade-specs-maintainer</code> 做一致性检查。
        </p>
      </section>

      <hr />
      <p>
        Next steps：
        <Link href="/docs/get-started">快速开始</Link> 或
        <Link href="/docs/api-token">API Token 使用指南</Link>
      </p>
    </DocsShell>
  );
}
