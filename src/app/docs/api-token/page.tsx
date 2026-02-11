import Link from "next/link";
import { DocsShell } from "../_components/docs-shell";
import { docsNav } from "../_components/docs-data";

const toc = [
  { title: "如何生成 Token", href: "#create", level: 2 as const },
  { title: "如何携带 Token 调用 API", href: "#auth", level: 2 as const },
  { title: "权限范围与限制", href: "#scope", level: 2 as const },
  { title: "常用接口（示例）", href: "#endpoints", level: 2 as const },
  { title: "对应 Skill", href: "#skill", level: 2 as const },
] as const;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-white whitespace-pre">
      {children}
    </pre>
  );
}

export default function ApiTokenDocPage() {
  return (
    <DocsShell
      title="API Token 使用指南"
      description="在无登录态场景（脚本/自动化）下读写交易。"
      nav={docsNav}
      toc={[...toc]}
    >
      <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
        <div className="font-semibold text-white">快速结论</div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Token 前缀为 <code>tc_</code>，创建时明文只返回一次，请妥善保存。
          </li>
          <li>
            Token 仅允许访问 <code>/trade/*</code>，其它模块一律拒绝。
          </li>
          <li>
            Token 可以读/写交易，但禁止删除交易（<code>DELETE /trade/:transactionId</code>
            会返回 403）。
          </li>
        </ul>
      </div>

      <section id="create">
        <h2>如何生成 Token</h2>
        <p>
          登录后进入 <strong>Trade → 开发者工具 → 集成中心 → API Token</strong>
          ，在页面上创建 Token。
        </p>
        <p>系统只会在创建成功时返回一次明文 Token；后端仅存储 hash。</p>
      </section>

      <section id="auth">
        <h2>如何携带 Token 调用 API</h2>
        <p>你可以用以下任意一种方式传 Token：</p>
        <ul>
          <li>
            <code>Authorization: Bearer tc_xxx</code>
          </li>
          <li>
            <code>X-API-Token: tc_xxx</code>
          </li>
        </ul>

        <CodeBlock>{`# 示例：读取 dashboard\ncurl -X GET "https://<YOUR_API_BASE>/trade/dashboard" \\\n  -H "Authorization: Bearer tc_xxx"`}</CodeBlock>
      </section>

      <section id="scope">
        <h2>权限范围与限制</h2>
        <ul>
          <li>
            仅允许 <code>/trade/*</code>
          </li>
          <li>允许创建/更新/查询交易</li>
          <li>禁止删除交易</li>
        </ul>
      </section>

      <section id="endpoints">
        <h2>常用接口（示例）</h2>

        <h3>创建交易</h3>
        <p>
          <code>POST /trade</code>
        </p>
        <CodeBlock>{`curl -X POST "https://<YOUR_API_BASE>/trade" \\\n  -H "Authorization: Bearer tc_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "symbol": "BTCUSDT",\n    "positionType": "Long",\n    "status": "Closed",\n    "profitLoss": 120.5,\n    "profitLossPercentage": 0.012\n  }'`}</CodeBlock>

        <h3>更新交易</h3>
        <p>
          <code>PATCH /trade/:transactionId</code>
        </p>
        <CodeBlock>{`curl -X PATCH "https://<YOUR_API_BASE>/trade/<transactionId>" \\\n  -H "Authorization: Bearer tc_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "summary": "按计划执行，止损设置合理。"\n  }'`}</CodeBlock>

        <h3>获取 dashboard</h3>
        <p>
          <code>GET /trade/dashboard</code>
        </p>

        <h3>获取图片上传 URL（给 Token 用的 trade-scoped 入口）</h3>
        <p>
          <code>POST /trade/image/upload-url</code>
        </p>
        <CodeBlock>{`curl -X POST "https://<YOUR_API_BASE>/trade/image/upload-url" \\\n  -H "Authorization: Bearer tc_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "contentType": "image/png",\n    "ext": "png"\n  }'`}</CodeBlock>
        <p className="text-xs text-gray-400">
          说明：为了不开放 <code>/image/*</code> 给 API Token，上传 URL 走 trade 作用域接口。
        </p>
      </section>

      <section id="skill">
        <h2>对应 Skill（外部 Agent 可下载）</h2>
        <p>
          我们新增了一个可直接给外部 Agent 使用的 Skill：
          <code>trade-api-token-agent</code>（包含“查询交易 + 编辑交易”API Token 调用模板）。
        </p>
        <p>
          下载地址：
          <a
            href="https://raw.githubusercontent.com/lfhwnqe/trade-sys-spec/main/skills/trade-api-token-agent/SKILL.md"
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-[#00c2b2] underline"
          >
            SKILL.md
          </a>
        </p>
      </section>

      <section id="clawbot">
        <h2>结合 Telegram Webhook：让你的 Clawbot 自动分析</h2>
        <p>
          推荐做法：让 webhook 把提醒推到 Telegram 群，然后由你自己的 clawbot 监听群消息，解析其中的
          <code>META_JSON</code>（包含 <code>transactionId</code>），再用 API Token 拉取 trade 的分析字段：
        </p>
        <CodeBlock>{`# 1) clawbot 从群消息 META_JSON 解析出 transactionId
# 2) 用 API token 拉取交易详情（包含计划、关键位、风控等）
curl -X GET "https://<YOUR_API_BASE>/trade/<transactionId>" \
  -H "Authorization: Bearer tc_xxx"`}</CodeBlock>
        <p className="mt-3">
          然后 clawbot 把 webhook message + trade 详情一起喂给你的分析 prompt/agent，即可生成报告并回发群。
        </p>
      </section>

      <hr />
      <p>
        Next steps：
        <Link href="/docs/webhook">Webhook 使用指南</Link>
      </p>
    </DocsShell>
  );
}
