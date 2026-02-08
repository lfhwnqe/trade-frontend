import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import HomeAuthCta from "@/components/home-auth-cta";
import {
  ArrowRight,
  BarChart3,
  KeyRound,
  Webhook,
  MessageSquare,
  Link2,
  Shield,
  LockKeyhole,
  Sparkles,
  ListChecks,
} from "lucide-react";
import Image from "next/image";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const features = [
  {
    title: "交易记录 + 仪表盘",
    desc: "交易生命周期结构化记录，仪表盘聚合统计（胜率趋势、近 30 笔对比等）。",
    icon: BarChart3,
    href: "/trade/home",
  },
  {
    title: "API Token（仅 /trade/*）",
    desc: "给脚本/自动化使用：可读写交易，不允许删除，权限面收敛到 /trade/*。",
    icon: KeyRound,
    href: "/docs/api-token",
  },
  {
    title: "Webhook（TradingView 单 URL）",
    desc: "不依赖额外 header：一个 hook 对应一个 Telegram 群，支持限流。",
    icon: Webhook,
    href: "/docs/webhook",
  },
  {
    title: "Telegram 群绑定",
    desc: "群内 /bind 完成绑定；TradingView webhook 触发后推送到绑定群。",
    icon: MessageSquare,
    href: "/trade/webhook",
  },
  {
    title: "Binance 合约同步（只读 Key）",
    desc: "同步 fills → 重建仓位（CLOSED/OPEN）→ 选择性导入为系统 Trade 复盘。",
    icon: Link2,
    href: "/docs/binance-futures",
  },
  {
    title: "安全与风控",
    desc: "token 仅存 hash；webhook 触发限流；触发 token 已改为 GSI 查询（无 scan）。",
    icon: Shield,
    href: "/docs",
  },
  {
    title: "账号设置：修改密码",
    desc: "登录态修改密码（Cognito ChangePassword），已提供前端页面入口。",
    icon: LockKeyhole,
    href: "/trade/password",
  },
];

const comingSoon = [
  {
    title: "订阅/支付体系",
    desc: "Plan/权益统一收口（Webhook 数量等），支付方式待定。",
    icon: Sparkles,
  },
  {
    title: "OPEN → EXITED 自动闭环",
    desc: "平仓后自动更新进行中 Trade，减少手工补 exit 字段。",
    icon: ListChecks,
  },
];

export default function HomeV2() {
  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${spaceGrotesk.className}`}>
      <style>{`
        :root { color-scheme: dark; }
        .grid-bg {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #00c2b2; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 grid-bg opacity-30" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center text-[#00c2b2]">
                <Image src={`/favicon.png`} width={30} height={30} alt="logo" />
              </div>
              <span className="text-xl font-bold tracking-tight">MMCTradeJournal</span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <Link className="text-sm font-medium transition-colors hover:text-[#00c2b2]" href="/home-v2">
                新版主页
              </Link>
              <Link className="text-sm font-medium transition-colors hover:text-[#00c2b2]" href="/docs">
                文档
              </Link>
              <Link className="text-sm font-medium transition-colors hover:text-[#00c2b2]" href="/trade/home">
                控制台
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <HomeAuthCta />
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <section className="relative overflow-hidden pb-16 pt-16 md:pt-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[#00c2b2]/10 blur-[120px]" />
            <div className="container mx-auto px-4 md:px-6">
              <div className="mx-auto max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00c2b2]/20 bg-[#00c2b2]/5 px-3 py-1 text-xs font-medium text-[#00c2b2]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00c2b2] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00c2b2]" />
                  </span>
                  已实现功能总览（按当前项目真实进度整理）
                </div>

                <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tighter md:text-6xl">
                  用数据复盘交易，
                  <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                    把系统接入你的执行流程。
                  </span>
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-base text-gray-400 md:text-lg">
                  这版主页用于把「已经落地的能力」清晰展示出来：交易记录/仪表盘、API Token、TradingView Webhook、Telegram 群绑定、
                  Binance 合约同步与仓位聚合。
                </p>

                <div className="mt-8 flex w-full flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/trade/home"
                    className="flex h-12 items-center justify-center gap-2 rounded bg-[#00c2b2] px-8 text-base font-bold text-black transition-all hover:bg-[#009e91]"
                  >
                    打开控制台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/docs/get-started"
                    className="flex h-12 items-center justify-center rounded border border-white/20 px-8 font-medium transition-all hover:bg-white/5"
                  >
                    快速开始
                  </Link>
                </div>
              </div>

              <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => (
                  <Link
                    key={f.title}
                    href={f.href}
                    className="group rounded-xl border border-white/10 bg-[#121212]/60 p-5 transition-colors hover:border-[#00c2b2]/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00c2b2]/10 text-[#00c2b2]">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{f.title}</div>
                        <div className="mt-1 text-sm text-gray-400">{f.desc}</div>
                        <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-400">打开 →</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mx-auto mt-10 max-w-6xl rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">待上线 / 规划中</div>
                <div className="mt-1 text-sm text-gray-400">把接下来最重要的缺口也写在这里，避免信息散落。</div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {comingSoon.map((c) => (
                    <div
                      key={c.title}
                      className="rounded-xl border border-white/10 bg-[#121212]/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white">
                          <c.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{c.title}</div>
                          <div className="mt-1 text-xs text-gray-400">{c.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-auto mt-10 max-w-6xl text-xs text-gray-500">
                说明：这页用于反映真实实现进度（不是营销承诺）。如需改成对外宣传版，可再单独做一套文案。
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-[#0a0a0a]">
          <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
            <div className="text-sm text-gray-400">© {new Date().getFullYear()} MMCTradeJournal</div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-400 hover:text-[#00c2b2]">旧版主页</Link>
              <Link href="/docs" className="text-gray-400 hover:text-[#00c2b2]">文档</Link>
              <Link href="/trade/home" className="text-gray-400 hover:text-[#00c2b2]">控制台</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
