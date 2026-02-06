import Link from "next/link";

const docs = [
  {
    title: "API Token 使用指南",
    desc: "如何生成 Token、如何调用接口、支持的接口范围与限制。",
    href: "/docs/api-token",
    tag: "Integration",
  },
  {
    title: "Webhook 使用指南（TradingView → Telegram 群）",
    desc: "一个 hook 对应一个群：创建、绑定、触发与限流说明。",
    href: "/docs/webhook",
    tag: "Integration",
  },
] as const;

export default function DocsIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              文档
            </h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              按“博客/文章”形式组织：快速上手、示例、约束与最佳实践。
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-300 hover:text-[#00c2b2]"
          >
            返回主页
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {docs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-white/10 bg-[#121212]/80 p-6 transition-colors hover:border-[#00c2b2]/40"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-[#00c2b2]">
                  {item.tag}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-gray-400">
                  阅读 →
                </div>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-base font-semibold">相关 Skill</h3>
          <p className="mt-2 text-sm text-gray-400">
            维护 specs/接口文档与前后端一致性检查，可复用 OpenClaw skill：
            <span className="ml-1 font-mono text-[#00c2b2]">
              trade-specs-maintainer
            </span>
            。
          </p>
        </div>
      </div>
    </div>
  );
}
