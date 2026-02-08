import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import HomeAuthCta from "@/components/home-auth-cta";
import {
  ArrowRight,
  Shield,
  Webhook,
  Link2,
  BarChart3,
  Terminal,
  GitBranch,
  Layers,
  Zap,
  RefreshCw,
  LineChart,
  CreditCard,
  Sparkles,
} from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function HomeV2() {
  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${spaceGrotesk.className}`}>
      <style>{`
        :root { color-scheme: dark; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #00c2b2; }
        .grid-bg {
          background-size: 50px 50px;
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          -webkit-mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
          mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 grid-bg" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <div className="text-[#00c2b2] flex items-center justify-center">
                <Image src={`/favicon.png`} width={30} height={30} alt="logo" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">MMCTradeJournal</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium text-gray-400 hover:text-[#00c2b2] transition-colors" href="#lifecycle">
                生命周期
              </a>
              <a className="text-sm font-medium text-gray-400 hover:text-[#00c2b2] transition-colors" href="#integrations">
                集成
              </a>
              <a className="text-sm font-medium text-gray-400 hover:text-[#00c2b2] transition-colors" href="#api">
                API
              </a>
              <a className="text-sm font-medium text-gray-400 hover:text-[#00c2b2] transition-colors" href="#security">
                安全
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <HomeAuthCta />
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {/* Hero */}
          <section className="relative pt-24 pb-32 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00c2b2]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00c2b2]/20 bg-[#00c2b2]/5 text-xs font-medium text-[#00c2b2] mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c2b2] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c2b2]" />
                  </span>
                  系统 v2：Webhook + Binance 同步已可用
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter text-white">
                  建立你的交易优势。
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2b2] via-cyan-400 to-white">
                    用结构化复盘更聪明地迭代。
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  一套管理完整交易生命周期的系统：事前计划 → 执行 → 数据同步 → 事后复盘。
                  让每一笔交易都有理由、有过程、有结论。
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                  <Link
                    href="/trade/home"
                    className="h-12 px-8 rounded bg-white text-black font-bold text-lg transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    开始记录
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/docs"
                    className="h-12 px-8 rounded border border-white/10 text-gray-300 hover:bg-white/5 font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal className="h-4 w-4" />
                    阅读文档
                  </Link>
                </div>
              </div>

              {/* Screenshot mock (keep same as v1 style for now) */}
              <div className="relative w-full max-w-6xl mx-auto group perspective-1000 mt-12">
                <div className="relative rounded-xl border border-white/10 bg-[#0f0f11] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-700 ease-out transform group-hover:scale-[1.005]">
                  <div className="h-10 border-b border-white/5 bg-[#151515] flex items-center px-4 gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="ml-4 h-6 px-4 bg-black/40 rounded border border-white/5 text-xs flex items-center text-gray-500 font-mono w-64">
                      app.mmctradejournal.com/journal
                    </div>
                  </div>

                  <div className="relative aspect-[16/9] w-full bg-[#0f0f11]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="交易复盘仪表盘（示意）"
                      className="w-full h-full object-cover opacity-90"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBwgUGn6geldT9bVd_pzVfzYT0XTZDzKCOcxXRxNxLD-qUfDgVN7udoC6A4Crd1P7NBG2rX4-77rd4IkRc3chKNdi1fu91H2yQbi4oWQgzP1D3U7G_NGlkdx8vdsZBzjblAacM5kYKyAmqJHAQ_nvFxXCrc3PxazISAmEeIsM71-c15uagwyNhCN_tqX4-XxzsdQ4ijVQavf_tllakFq7i9diO8VI7FuleltmtdsNkLhptyqzcjxwdkJPyiUUM1Qnx4GErfvuj4g"
                    />

                    <div className="absolute bottom-6 left-6 flex gap-4">
                      <div className="bg-black/80 backdrop-blur border border-white/10 p-3 rounded-lg flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-[#00c2b2]/20 flex items-center justify-center text-[#00c2b2]">
                          <Webhook className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                            最新 Webhook
                          </div>
                          <div className="text-xs text-white font-mono">
                            BTCUSDC 空单加仓 @ 69008.4
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-6 right-6 w-64 bg-[#0f0f11]/95 border border-white/10 p-4 rounded-lg backdrop-blur shadow-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-gray-400 font-medium uppercase">
                          本月
                        </div>
                        <div className="text-xs text-[#00c2b2] bg-[#00c2b2]/10 px-2 py-0.5 rounded">
                          +12.4%
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">胜率</span>
                          <span className="text-white font-mono">68.4%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#00c2b2] h-full w-[68%]" />
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-gray-500">Profit Factor</span>
                          <span className="text-white font-mono">2.14</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ticker */}
          <div className="w-full border-y border-white/5 bg-[#080808] py-3 overflow-hidden">
            <div className="flex gap-16 whitespace-nowrap text-xs font-mono font-medium text-gray-500 px-4">
              <span className="flex items-center gap-2">
                <span className="text-white">BTCUSDC</span>
                <span className="text-[#00c2b2]">生命周期：进行中</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-white">ETHUSDT</span>
                <span className="text-gray-600">生命周期：已离场</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-white">API 延迟</span>
                <span className="text-green-500">24ms</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-white">Webhook</span>
                <span className="text-green-500">正常</span>
              </span>
            </div>
          </div>

          {/* Lifecycle */}
          <section id="lifecycle" className="py-24 border-b border-white/5 bg-[#0a0a0a] relative">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  结构化交易生命周期
                </h2>
                <p className="text-gray-400">把混乱变成流程：每一笔交易都有明确路径。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00c2b2]/30 to-transparent z-0" />

                {[
                  {
                    title: "1. 计划",
                    desc: "事前分析：明确入场、止损、止盈与执行条件。",
                    icon: Layers,
                  },
                  {
                    title: "2. 执行",
                    desc: "下单执行：Webhook 可从 TradingView 把信号推送到 Telegram 群。",
                    icon: Zap,
                  },
                  {
                    title: "3. 同步",
                    desc: "Binance 合约同步：fills/手续费/仓位（OPEN/CLOSED）聚合落库。",
                    icon: RefreshCw,
                  },
                  {
                    title: "4. 复盘",
                    desc: "事后复盘：胜率趋势、近 30 笔对比、总结沉淀与复读。",
                    icon: LineChart,
                  },
                ].map((it) => (
                  <div
                    key={it.title}
                    className="relative z-10 flex flex-col items-center text-center group"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-[#0f0f11] border border-white/10 flex items-center justify-center mb-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] group-hover:border-[#00c2b2]/50 transition-colors">
                      <it.icon className="h-10 w-10 text-gray-400 group-hover:text-[#00c2b2] transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{it.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{it.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Capabilities */}
          <section id="integrations" className="py-24 bg-[#0f0f11]/50 relative">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    核心能力
                  </h2>
                  <p className="text-gray-400">为手动交易与自动化工作流准备。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
                <div className="md:col-span-2 rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col justify-between group hover:border-[#00c2b2]/30 transition-colors relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#00c2b2]/5 to-transparent" />
                  <div className="relative z-10 mb-8">
                    <div className="h-10 w-10 rounded bg-[#00c2b2]/10 flex items-center justify-center text-[#00c2b2] mb-4">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">结构化 Trade 生命周期</h3>
                    <p className="text-gray-400 max-w-md">
                      不只是记录盈亏，更是记录过程。系统把交易分阶段固化为工作流，
                      让每一笔交易都能沉淀复用的经验。
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto opacity-80">
                    {[
                      { stage: "阶段 1", text: "事前分析" },
                      { stage: "阶段 2", text: "执行记录" },
                      { stage: "阶段 3", text: "复盘总结" },
                    ].map((s, idx) => (
                      <div key={s.stage} className="flex items-center gap-2 flex-1">
                        <div className="w-full bg-white/5 rounded p-3 border border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase">{s.stage}</div>
                          <div className={`text-sm font-mono ${idx === 0 ? "text-[#00c2b2]" : "text-white"}`}>{s.text}</div>
                        </div>
                        {idx < 2 ? <ArrowRight className="h-4 w-4 text-gray-600" /> : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div id="api" className="md:row-span-2 rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col group hover:border-[#00c2b2]/30 transition-colors relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="h-10 w-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                      <Terminal className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">开发者 API</h3>
                    <p className="text-gray-400 mb-6 text-sm">
                      用 API Token 把你的交易数据接入脚本/自动化；权限面收敛到 `/trade/*`，
                      并禁止删除交易。
                    </p>

                    <div className="bg-black rounded-lg p-4 border border-white/5 font-mono text-xs overflow-hidden">
                      <div className="flex gap-1.5 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      </div>
                      <p className="text-gray-500 mb-2">{"// 获取交易列表"}</p>
                      <p>
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-400">trades</span>{" "}=
                        {" "}
                        <span className="text-purple-400">await</span>{" "}
                        client.<span className="text-yellow-300">listTrades</span>({"{"}
                      </p>
                      <p className="pl-4">
                        <span className="text-blue-300">pageSize</span>: {" "}
                        <span className="text-orange-300">50</span>
                      </p>
                      <p>{"}"});</p>
                      <p className="mt-2 text-gray-500">{"// Token 格式"}</p>
                      <p className="text-gray-400">tc_83k...92x</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col group hover:border-[#00c2b2]/30 transition-colors">
                  <div className="h-10 w-10 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-4">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Binance 合约同步</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    只读 Key 同步成交 fills，重建仓位（OPEN/CLOSED），并可转换为 Trade（ENTERED/EXITED）。
                    支持 usdtm/coinm 市场。
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-xs font-mono text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    同步可用
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col group hover:border-[#00c2b2]/30 transition-colors">
                  <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                    <Webhook className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Webhook + Telegram</h3>
                  <p className="text-gray-400 text-sm">
                    TradingView 单 URL 触发（无需 header），一个 hook 对应一个 Telegram 群，并带限流。
                  </p>
                </div>

                <div className="md:col-span-3 lg:col-span-1 rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col group hover:border-[#00c2b2]/30 transition-colors">
                  <div className="h-10 w-10 rounded bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">统计与趋势</h3>
                  <p className="text-gray-400 text-sm">
                    胜率趋势（7d/30d/3m）、近 30 笔对比、仪表盘聚合与高质量总结高亮。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="py-20 border-y border-white/5 bg-[#0a0a0a]">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">安全设计</h2>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    交易数据敏感，系统默认采用更保守的安全策略：权限收敛、不可逆存储、限流与幂等。
                  </p>

                  <ul className="space-y-4">
                    {[
                      {
                        title: "Token Hash 存储",
                        desc: "API Token 明文仅创建时返回一次，服务端只保存 hash。",
                      },
                      {
                        title: "权限面收敛",
                        desc: "API Token 仅允许访问 /trade/*，并禁止删除交易。",
                      },
                      {
                        title: "限流与可用性",
                        desc: "Webhook 每 hook 1 分钟最多触发 1 次；triggerToken 走 GSI 查询避免 scan。",
                      },
                    ].map((it) => (
                      <li key={it.title} className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-[#00c2b2] mt-1" />
                        <div>
                          <h4 className="text-white font-medium">{it.title}</h4>
                          <p className="text-sm text-gray-500">{it.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-[#00c2b2]/5 blur-3xl rounded-full" />
                  <div className="relative bg-[#0f0f11] border border-white/10 rounded-xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center mb-6">
                      <Shield className="h-14 w-14 text-gray-600" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                        <div className="h-full bg-[#00c2b2] w-full animate-pulse" />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-gray-500">
                        <span>权限</span>
                        <span className="text-[#00c2b2]">/trade/* only</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-gray-500">
                        <span>状态</span>
                        <span className="text-[#00c2b2]">SECURE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Coming soon */}
          <section className="py-16 bg-[#0f0f11] border-b border-white/5">
            <div className="container mx-auto px-4 text-center">
              <div className="inline-block p-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-6">
                Roadmap
              </div>
              <h3 className="text-2xl font-bold text-white mb-8">即将上线</h3>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="bg-[#0a0a0a] border border-white/5 px-6 py-4 rounded-lg flex items-center gap-3 opacity-70">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">订阅/付费方案</span>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 px-6 py-4 rounded-lg flex items-center gap-3 opacity-70">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">OPEN → EXITED 自动闭环</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#0a0a0a] pt-20 pb-10">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <Image src={`/favicon.png`} width={24} height={24} alt="logo" />
                    <span className="text-lg font-bold text-white">MMCTradeJournal</span>
                  </div>
                  <p className="text-gray-500 max-w-sm text-sm">
                    面向严肃交易者的复盘与集成系统：停止凭感觉，开始按系统运营。
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4 text-sm">平台</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link className="hover:text-[#00c2b2] transition-colors" href="/trade/home">控制台</Link></li>
                    <li><Link className="hover:text-[#00c2b2] transition-colors" href="/trade/binance-futures">币安同步</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4 text-sm">资源</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><Link className="hover:text-[#00c2b2] transition-colors" href="/docs">文档中心</Link></li>
                    <li><Link className="hover:text-[#00c2b2] transition-colors" href="/docs/get-started">快速开始</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4 text-sm">安全</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><a className="hover:text-[#00c2b2] transition-colors" href="#security">设计原则</a></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                <p>© {new Date().getFullYear()} MMCTradeJournal. All rights reserved.</p>
                <div className="mt-4 md:mt-0">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    系统运行正常
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
