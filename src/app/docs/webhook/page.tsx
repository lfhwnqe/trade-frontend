import Link from "next/link";
import { DocsShell } from "../_components/docs-shell";
import { docsNav } from "../_components/docs-data";

const toc = [
  { title: "用户教程：从 0 到跑通", href: "#user", level: 2 as const },
  { title: "创建 Telegram 群", href: "#group", level: 3 as const },
  { title: "创建 Trade webhook", href: "#create", level: 3 as const },
  { title: "把 bot 拉进群并绑定", href: "#bind", level: 3 as const },
  { title: "配置 TradingView alert", href: "#tv", level: 3 as const },
  { title: "开发者教程：接口与调试", href: "#dev", level: 2 as const },
  { title: "触发方式（推荐：前端代理）", href: "#trigger", level: 3 as const },
  { title: "限流与配额", href: "#limits", level: 3 as const },
  { title: "后端直连触发接口", href: "#backend-endpoint", level: 3 as const },
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
      title="Webhook 使用指南（TradingView → Telegram，按交易绑定）"
      description="每条交易可以创建一个专属 webhook：触发后推送到绑定的 Telegram 群。"
      nav={docsNav}
      toc={[...toc]}
    >
      <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
        <div className="font-semibold text-white">核心模型</div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>1 笔交易 = 1 个 webhook</strong>（避免“群里只有提醒但不知道对应哪条交易”）。
          </li>
          <li>
            webhook URL 形态：<code>/webhook/trade-alert/:triggerToken/:tradeShortId</code>
          </li>
          <li>
            每个 webhook 绑定一个 Telegram 群：群内发送 <code>/bind &lt;bindCode&gt;</code>
          </li>
          <li>
            防滥用：每个 webhook 限流 <code>1 分钟最多 1 次</code>
          </li>
          <li>
            配额：按用户等级限制可创建的 webhook 数量（Pro 1 个；Admin/SuperAdmin 5 个；Free 提示升级）。
          </li>
        </ul>
      </div>

      <section id="user">
        <h2>用户教程：从 0 到跑通</h2>

        <section id="group">
          <h3>1) 创建 Telegram 群</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-300">
            <li>在 Telegram 新建一个群（建议专门用于交易提醒/讨论）。</li>
            <li>把你的队友/小号拉进群（可选）。</li>
          </ol>
        </section>

        <section id="create">
          <h3>2) 创建 Trade webhook</h3>
          <p className="mt-3 text-gray-300">
            打开某条交易详情页，在「TradingView Webhook（此交易）」区块点击「创建 webhook」。
            创建成功后会拿到：
            <code>triggerUrl</code>（TradingView 要填的 URL）和 <code>bindCode</code>（群绑定用）。
          </p>
        </section>

        <section id="bind">
          <h3>3) 把 bot 拉进群并绑定</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-300">
            <li>把官方 bot 拉进你刚创建的 Telegram 群。</li>
            <li>在群里发送：</li>
          </ol>
          <CodeBlock>{`/bind <bindCode>`}</CodeBlock>
          <p className="mt-3 text-gray-300">
            绑定成功后，这条交易的 TradingView 触发会推送到该群。
          </p>
        </section>

        <section id="tv">
          <h3>4) 配置 TradingView alert</h3>
          <p className="mt-3 text-gray-300">
            在 TradingView 的 Alert 配置里，把 webhook URL 填成你刚创建得到的 <code>triggerUrl</code>。
            body 建议至少包含一段可读消息：
          </p>
          <CodeBlock>{`{ "message": "BTCUSDC 回踩关键位，计划 A 触发" }`}</CodeBlock>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 text-gray-300">
            <div className="font-semibold text-white">给 Clawbot 用的结构化信息</div>
            <p className="mt-2">
              系统推送到 Telegram 群的消息会包含一个 <code>META_JSON</code> 代码块，里面有：
              <code>transactionId</code> / <code>tradeShortId</code> 等字段。
              你的 clawbot 可以从群消息中解析这些字段后，用你自己的 API Token 调用 <code>/trade/*</code> 接口拉取该交易的分析数据，再结合 webhook 的 message 做二次分析。
            </p>
          </div>
        </section>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4 text-gray-300">
          <div className="font-semibold text-white">关于“分析 bot”</div>
          <p className="mt-2">
            Pro 用户未来可开启“自动分析报告”：系统会把该交易里写的计划/关键位/风控，与 TradingView 触发上下文一起生成结构化报告，并回到同一个群。
          </p>
        </div>
      </section>

      <section id="dev">
        <h2>开发者教程：接口与调试</h2>

        <section id="trigger">
          <h3>触发方式（推荐：前端代理）</h3>
          <p className="mt-3">
            推荐使用前端代理（更稳定，也避免暴露后端真实 base URL）：
            <code>POST /api/webhook?token=tw_xxx&amp;tradeShortId=tr_xxx</code>
          </p>
          <CodeBlock>{`curl -X POST "https://<YOUR_FRONTEND_ORIGIN>/api/webhook?token=tw_xxx&tradeShortId=tr_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"BTCUSDC 回踩关键位"}'`}</CodeBlock>
        </section>

        <section id="limits">
          <h3>限流与配额</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-300">
            <li>限流：同一个 webhook 1 分钟最多触发 1 次。</li>
            <li>配额：Pro 1 / Admin 5 / Free 提示升级。</li>
          </ul>
        </section>

        <section id="backend-endpoint">
          <h3>后端直连触发接口（直连）</h3>
          <CodeBlock>{`POST https://<YOUR_API_BASE>/webhook/trade-alert/:triggerToken/:tradeShortId\nBody: { "message": "..." }\n(无需额外 header)`}</CodeBlock>
        </section>
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
