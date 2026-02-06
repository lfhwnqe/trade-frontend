import Link from "next/link";
import { DocsShell } from "./_components/docs-shell";
import { docsNav } from "./_components/docs-data";

const docs = [
  {
    title: "快速开始（集成指引一条龙）",
    desc: "3~5 分钟跑通：Webhook → Telegram 群 →（可选）API Token。",
    href: "/docs/get-started",
    tag: "Getting started",
  },
  {
    title: "API Token 使用指南",
    desc: "如何生成 Token、如何调用接口、支持的接口范围与限制。",
    href: "/docs/api-token",
    tag: "Integrations",
  },
  {
    title: "Webhook 使用指南（TradingView → Telegram 群）",
    desc: "一个 hook 对应一个群：创建、绑定、触发与限流说明。",
    href: "/docs/webhook",
    tag: "Integrations",
  },
] as const;

export default function DocsIndexPage() {
  return (
    <DocsShell
      title="文档"
      description="像 Anthropic Docs 一样：任务导向、短路径、每页只解决一个问题。"
      nav={docsNav}
      toc={[]}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {docs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-white/10 bg-[#121212]/70 p-6 transition-colors hover:border-[#00c2b2]/40"
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
    </DocsShell>
  );
}
