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

export default function ApiTokenDocPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs font-medium text-[#00c2b2]">Integration</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              API Token 使用指南
            </h1>
            <p className="mt-3 text-sm text-gray-400 md:text-base">
              用 API Token 在无登录态场景（脚本/TradingView/自动化）下读写交易。
            </p>
          </div>
          <Link href="/docs" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            ← 返回文档
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-[#121212]/70 p-5 text-sm text-gray-300">
          <div className="font-semibold text-white">快速结论</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Token 前缀为 <span className="font-mono text-[#00c2b2]">tc_</span>
              ，创建时明文只返回一次，请妥善保存。
            </li>
            <li>
              Token 仅允许访问 <span className="font-mono">/trade/*</span>
              ，其它模块一律拒绝。
            </li>
            <li>
              Token 可以读/写交易，但禁止删除交易（
              <span className="font-mono">DELETE /trade/:transactionId</span> 会返回 403）。
            </li>
          </ul>
        </div>

        <H2 id="create">1. 如何生成 Token</H2>
        <p className="mt-3 text-sm text-gray-400">
          登录后进入 <span className="font-mono text-white">Trade → Developer Tools → Integration Center → API Token</span>
          ，在页面上创建 Token。
        </p>
        <p className="mt-3 text-sm text-gray-400">
          系统只会在创建成功时返回一次明文 Token；后端仅存储 hash。
        </p>

        <H2 id="auth">2. 如何携带 Token 调用 API</H2>
        <p className="mt-3 text-sm text-gray-400">
          你可以用以下任意一种方式传 Token：
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-300">
          <li>
            <span className="font-mono">Authorization: Bearer tc_xxx</span>
          </li>
          <li>
            <span className="font-mono">X-API-Token: tc_xxx</span>
          </li>
        </ul>

        <CodeBlock>{`# 示例：读取 dashboard
curl -X GET "https://<YOUR_API_BASE>/trade/dashboard" \
  -H "Authorization: Bearer tc_xxx"`}</CodeBlock>

        <H2 id="scope">3. 允许访问的接口范围与限制</H2>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
          <div className="font-semibold text-white">权限范围（强约束）</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              仅允许 <span className="font-mono text-white">/trade/*</span>
            </li>
            <li>允许创建/更新/查询交易</li>
            <li>禁止删除交易</li>
          </ul>
        </div>

        <H2 id="endpoints">4. 常用接口（示例）</H2>
        <p className="mt-3 text-sm text-gray-400">
          以下是当前集成场景最常用的一组接口（实际字段以产品页面表单为准）。
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#121212]/70 p-5">
            <div className="text-sm font-semibold text-white">创建交易</div>
            <div className="mt-1 text-xs text-gray-400">
              <span className="font-mono">POST /trade</span>
            </div>
            <CodeBlock>{`curl -X POST "https://<YOUR_API_BASE>/trade" \
  -H "Authorization: Bearer tc_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "positionType": "Long",
    "status": "Closed",
    "profitLoss": 120.5,
    "profitLossPercentage": 0.012
  }'`}</CodeBlock>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121212]/70 p-5">
            <div className="text-sm font-semibold text-white">更新交易</div>
            <div className="mt-1 text-xs text-gray-400">
              <span className="font-mono">PATCH /trade/:transactionId</span>
            </div>
            <CodeBlock>{`curl -X PATCH "https://<YOUR_API_BASE>/trade/<transactionId>" \
  -H "Authorization: Bearer tc_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "按计划执行，止损设置合理。"
  }'`}</CodeBlock>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121212]/70 p-5">
            <div className="text-sm font-semibold text-white">获取 dashboard</div>
            <div className="mt-1 text-xs text-gray-400">
              <span className="font-mono">GET /trade/dashboard</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121212]/70 p-5">
            <div className="text-sm font-semibold text-white">
              获取图片上传 URL（给 Token 用的 trade-scoped 入口）
            </div>
            <div className="mt-1 text-xs text-gray-400">
              <span className="font-mono">POST /trade/image/upload-url</span>
            </div>
            <CodeBlock>{`curl -X POST "https://<YOUR_API_BASE>/trade/image/upload-url" \
  -H "Authorization: Bearer tc_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "image/png",
    "ext": "png"
  }'`}</CodeBlock>
            <p className="mt-2 text-xs text-gray-400">
              说明：为了不开放 <span className="font-mono">/image/*</span> 给 API Token，上传 URL 走 trade 作用域接口。
            </p>
          </div>
        </div>

        <H2 id="skill">5. 对应 Skill（文档/规格维护）</H2>
        <p className="mt-3 text-sm text-gray-400">
          如果你在做“接口变更 → 文档同步 → 前后端一致性检查”，可以用 OpenClaw skill：
          <span className="ml-1 font-mono text-[#00c2b2]">trade-specs-maintainer</span>
          （生成/维护 spec，校验 DTO 与前端枚举/常量漂移）。
        </p>

        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
          <Link href="/docs" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            ← 返回文档
          </Link>
          <Link href="/docs/webhook" className="text-sm text-gray-300 hover:text-[#00c2b2]">
            下一篇：Webhook 使用指南 →
          </Link>
        </div>
      </div>
    </div>
  );
}
