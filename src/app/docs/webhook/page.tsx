import Link from "next/link";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-white whitespace-pre">
      {children}
    </pre>
  );
}

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mt-10 text-xl font-semibold text-white">
      {children}
    </h2>
  );
}

export default function WebhookDocPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs font-medium text-[#00c2b2]">Integration</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Webhook 使用指南（TradingView → Telegram 群）
            </h1>
            <p className="mt-3 text-sm text-gray-400 md:text-base">
              一个 hook 对应一个 Telegram 群：创建 → 绑定 → 触发 → 推送到群。
            </p>
          </div>
          <Link href="/docs" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            ← 返回文档
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-[#121212]/70 p-5 text-sm text-gray-300">
          <div className="font-semibold text-white">核心模型</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              每个 hook 都会生成一个唯一触发 URL（TradingView 友好：无需额外 header）。
            </li>
            <li>
              每个 hook 绑定一个 Telegram 群：在群里发送
              <span className="ml-1 font-mono text-white">/bind &lt;bindCode&gt;</span>
              完成绑定。
            </li>
            <li>
              防滥用：每个 hook 限流 <span className="font-mono text-white">1 分钟最多 1 次</span>。
            </li>
          </ul>
        </div>

        <H2 id="create">1. 创建 Webhook</H2>
        <p className="mt-3 text-sm text-gray-400">
          登录后进入 <span className="font-mono text-white">Trade → Developer Tools → Integration Center → Webhook</span>
          ，创建一个 hook。
        </p>
        <p className="mt-3 text-sm text-gray-400">
          创建成功后会拿到：
          <span className="ml-1 font-mono text-white">triggerUrl</span>
          、
          <span className="font-mono text-white">bindCode</span>
          等信息。
        </p>

        <H2 id="bind">2. 绑定 Telegram 群</H2>
        <p className="mt-3 text-sm text-gray-400">
          把机器人拉进目标 Telegram 群，在群里发送：
        </p>
        <CodeBlock>{`/bind <bindCode>`}</CodeBlock>
        <p className="mt-3 text-sm text-gray-400">
          绑定成功后，此 hook 的所有触发消息都会推送到该群。
        </p>

        <H2 id="trigger">3. 触发方式（推荐：前端代理 URL）</H2>
        <p className="mt-3 text-sm text-gray-400">
          为了让 TradingView/外部系统更稳定地触发（且避免暴露后端真实 base URL），前端提供了代理接口：
        </p>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
          <div className="font-semibold text-white">推荐触发 URL</div>
          <div className="mt-2 font-mono text-xs text-white">
            POST /api/webhook?token=tw_xxx
          </div>
          <div className="mt-2 text-xs text-gray-400">
            请求 body：<span className="font-mono">{`{ "message": "..." }`}</span>
          </div>
        </div>

        <CodeBlock>{`curl -X POST "https://<YOUR_FRONTEND_ORIGIN>/api/webhook?token=tw_xxx" \
  -H "Content-Type: application/json" \
  -d '{"message":"BTC breakout, log a new trade."}'`}</CodeBlock>

        <H2 id="rate-limit">4. 限流说明</H2>
        <p className="mt-3 text-sm text-gray-400">
          每个 hook 限流：1 分钟最多触发 1 次。
          如果触发过快，接口会返回 delivered=false，并给出 nextInMs。
        </p>

        <H2 id="backend-endpoint">5. 后端触发接口（直连）</H2>
        <p className="mt-3 text-sm text-gray-400">
          如果你要绕过前端代理，后端也支持直接触发：
        </p>
        <CodeBlock>{`POST https://<YOUR_API_BASE>/webhook/trade-alert/:triggerToken
Body: { "message": "..." }
(无需额外 header)`}</CodeBlock>

        <H2 id="legacy">6. Legacy 接口（兼容旧模式）</H2>
        <p className="mt-3 text-sm text-gray-400">
          旧接口仍保留兼容（需要 header secret）：
        </p>
        <CodeBlock>{`POST https://<YOUR_API_BASE>/webhook/trade-alert/hook/:hookId
Header: x-webhook-secret: <secret>`}</CodeBlock>

        <H2 id="skill">7. 对应 Skill（规格/文档维护）</H2>
        <p className="mt-3 text-sm text-gray-400">
          和 Webhook 相关的接口/字段变更，建议同步维护 specs 文档，并用 OpenClaw skill
          <span className="ml-1 font-mono text-[#00c2b2]">trade-specs-maintainer</span>
          做一致性检查。
        </p>

        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
          <Link href="/docs/api-token" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            ← 上一篇：API Token 使用指南
          </Link>
          <Link href="/docs" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            返回文档首页 →
          </Link>
        </div>
      </div>
    </div>
  );
}
