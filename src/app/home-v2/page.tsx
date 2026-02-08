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
  MessageSquare,
  Brain,
  Mail,
  Database,
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
        .circuit-bg {
          background-image: radial-gradient(#00c2b2 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.05;
        }
        .glass-card {
          background: rgba(15, 15, 17, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-hover:hover {
          box-shadow: 0 0 30px -5px rgba(0, 194, 178, 0.3);
          border-color: rgba(0, 194, 178, 0.5);
        }
        .animate-scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, transparent, #00c2b2, transparent);
          box-shadow: 0 0 15px #00c2b2;
          animation: scan 4s linear infinite;
          z-index: 20;
          opacity: 0.7;
          left: 0;
        }
        .data-flow-line {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00c2b2, transparent);
          background-size: 200% 100%;
          animation: flowHorizontal 2.2s linear infinite;
          z-index: 0;
          opacity: 0.28;
        }
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes flowHorizontal {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 grid-bg" />
      <div className="fixed inset-0 pointer-events-none z-0 circuit-bg" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <div className="text-[#00c2b2] flex items-center justify-center pulse-slow">
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
                自动化
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
              <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto mb-16 fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00c2b2]/20 bg-[#00c2b2]/5 text-xs font-medium text-[#00c2b2] mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c2b2] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c2b2]" />
                  </span>
                  已上线：TradingView 提醒 → Telegram 群同步 + 币安合约同步
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter text-white">
                  把每一笔交易
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2b2] via-cyan-400 to-white">
                    变成下一次更稳的底气。
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  你不需要把截图、想法、成交记录散落在不同地方。
                  MMCTradeJournal 把「计划 → 执行 → 同步 → 复盘」串成一条线：
                  记录得越清楚，改进就越有方向。
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                  <Link
                    href="/trade/home"
                    className="h-12 px-8 rounded bg-white text-black font-bold text-lg transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    进入交易控制台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/docs"
                    className="h-12 px-8 rounded border border-white/10 text-gray-300 hover:bg-white/5 font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal className="h-4 w-4" />
                    了解怎么用
                  </Link>
                </div>
              </div>

              {/* Screenshot mock (keep same as v1 style for now) */}
              <div className="relative w-full max-w-6xl mx-auto group perspective-1000 mt-12 fade-in-up delay-200">
                <div className="relative rounded-xl border border-white/10 bg-[#0f0f11] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 ease-out transform group-hover:scale-[1.005] glow-hover">
                  <div className="animate-scan-line" />
                  <div className="h-10 border-b border-white/5 bg-[#151515] flex items-center px-4 gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="ml-4 h-6 px-4 bg-black/40 rounded border border-white/5 text-xs flex items-center text-gray-500 font-mono w-64">
                      https://trade.maomaocong.com
                    </div>
                  </div>

                  <div className="relative aspect-[16/9] w-full bg-[#0f0f11]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="交易复盘仪表盘（示意）"
                      className="w-full h-full object-cover opacity-90"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBwgUGn6geldT9bVd_pzVfzYT0XTZDzKCOcxXRxNxLD-qUfDgVN7udoC6A4Crd1P7NBG2rX4-77rd4IkRc3chKNdi1fu91H2yQbi4oWQgzP1D3U7G_NGlkdx8vdsZBzjblAacM5kYKyAmqJHAQ_nvFxXCrc3PxazISAmEeIsM71-c15uagwyNhCN_tqX4-XxzsdQ4ijVQavf_tllakFq7i9diO8VI7FuleltmtdsNkLhptyqzcjxwdkJPyiUUM1Qnx4GErfvuj4g"
                    />

                    <div className="absolute bottom-6 left-6 flex gap-4 animate-float">
                      <div className="glass-card p-3 rounded-lg flex items-center gap-3 border-l-2 border-l-[#00c2b2] shadow-lg">
                        <div className="h-8 w-8 rounded bg-[#00c2b2]/20 flex items-center justify-center text-[#00c2b2]">
                          <Webhook className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                            Webhook → Telegram 群
                          </div>
                          <div className="text-xs text-white font-mono">
                            BTCUSDC 空单加仓 @ 69008.4 → 推送到群
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-6 right-6 w-64 glass-card p-4 rounded-lg shadow-2xl animate-float" style={{ animationDelay: "1s" }}>
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
          <div className="w-full border-y border-white/5 bg-[#080808] py-3 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
            <div className="flex gap-16 whitespace-nowrap text-xs font-mono font-medium text-gray-500 px-4" style={{ animation: "flowHorizontal 20s linear infinite" }}>
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
          <section
            id="lifecycle"
            className="py-24 border-b border-white/5 bg-[#0a0a0a] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00c2b2]/5 via-[#0a0a0a] to-[#0a0a0a] opacity-40" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="text-center mb-20 fade-in-up">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  交易不是一条记录，而是一段过程
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  把“凭感觉”变成“有据可依”：每一步都能回看、复盘、改进。
                </p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 z-0" />

                <div
                  className="hidden lg:block absolute top-1/2 left-[25%] w-2 h-2 bg-[#00c2b2] rounded-full z-20"
                  style={{ boxShadow: "0 0 10px #00c2b2", animation: "ping 3s linear infinite" }}
                />
                <div
                  className="hidden lg:block absolute top-1/2 left-[50%] w-2 h-2 bg-[#00c2b2] rounded-full z-20"
                  style={{ boxShadow: "0 0 10px #00c2b2", animation: "ping 3s linear infinite", animationDelay: "1s" }}
                />
                <div
                  className="hidden lg:block absolute top-1/2 left-[75%] w-2 h-2 bg-[#00c2b2] rounded-full z-20"
                  style={{ boxShadow: "0 0 10px #00c2b2", animation: "ping 3s linear infinite", animationDelay: "2s" }}
                />

                {[
                  {
                    node: "NODE_01",
                    title: "1. 计划",
                    desc: "下单前把理由写清楚：为什么进、哪里错、什么时候离场。",
                    icon: Layers,
                    delay: "delay-100",
                    barDelay: "",
                  },
                  {
                    node: "NODE_02",
                    title: "2. 执行",
                    desc: "TradingView 提醒直接同步到 Telegram 群，群里所有人都能第一时间看到。",
                    icon: Zap,
                    delay: "delay-200",
                    barDelay: "100ms",
                  },
                  {
                    node: "NODE_03",
                    title: "3. 同步",
                    desc: "币安成交自动同步进来，系统会帮你整理成“这一次持仓”的完整记录。",
                    icon: RefreshCw,
                    delay: "delay-300",
                    barDelay: "200ms",
                  },
                  {
                    node: "NODE_04",
                    title: "4. 复盘",
                    desc: "复盘不只是算盈亏：找出做对/做错的模式，下一次少踩同样的坑。",
                    icon: LineChart,
                    delay: "delay-400",
                    barDelay: "300ms",
                  },
                ].map((it) => (
                  <div key={it.title} className={`group relative z-10 fade-in-up ${it.delay}`}>
                    <div className="h-full bg-[#0f0f11]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#00c2b2]/50 hover:shadow-[0_0_25px_-5px_rgba(0,194,178,0.25)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00c2b2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                      <div className="relative z-10 flex flex-col items-start h-full">
                        <div className="w-16 h-16 rounded-xl bg-[#0f0f11] border border-white/10 flex items-center justify-center mb-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] group-hover:border-[#00c2b2]/60 group-hover:shadow-[0_0_20px_rgba(0,194,178,0.25)] transition-all duration-300">
                          <it.icon className="h-8 w-8 text-gray-400 group-hover:text-[#00c2b2] transition-colors" />
                        </div>

                        <div className="text-xs font-mono text-[#00c2b2] mb-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                          {it.node}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">{it.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">{it.desc}</p>

                        <div className="mt-auto w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00c2b2] w-0 group-hover:w-full transition-all duration-700 ease-in-out"
                            style={{ transitionDelay: it.barDelay ? it.barDelay : undefined }}
                          />
                        </div>
                      </div>
                    </div>
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
                    你会用到的功能
                  </h2>
                  <p className="text-gray-400">不用懂技术，也能把交易流程“管起来”。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
                <div className="md:col-span-2 rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col justify-between group hover:border-[#00c2b2]/30 transition-colors relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#00c2b2]/5 to-transparent" />
                  <div className="relative z-10 mb-8">
                    <div className="h-10 w-10 rounded bg-[#00c2b2]/10 flex items-center justify-center text-[#00c2b2] mb-4">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">把交易“管得住”</h3>
                    <p className="text-gray-400 max-w-md">
                      不只是记一条盈亏。
                      你可以把每次进出场背后的想法、证据、执行情况都留在同一条交易里，
                      以后回看会很清楚：哪次是策略对、哪次是执行错。
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
                    <h3 className="text-2xl font-bold text-white mb-2">自动化写入（可选）</h3>
                    <p className="text-gray-400 mb-6 text-sm">
                      如果你有脚本、策略或想做自动化：可以用“API Token”把分析结果直接写进系统。
                      不想折腾也没关系——手动记录一样好用。
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
                  <h3 className="text-xl font-bold text-white mb-2">币安合约同步（省掉手工抄单）</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    连接你的只读 Key 后，成交记录会自动同步进来。
                    系统会帮你整理出“这一笔持仓”的来龙去脉，方便你后续复盘和管理。
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
                  <h3 className="text-xl font-bold text-white mb-2">TradingView → Telegram 群</h3>
                  <p className="text-gray-400 text-sm">
                    你在 TradingView 触发提醒，消息会第一时间进到 Telegram 群里。
                    不管是你自己复盘，还是团队协作，都能保持信息一致。
                  </p>
                </div>

                <div className="md:col-span-3 lg:col-span-1 rounded-2xl bg-[#0f0f11] border border-white/10 p-8 flex flex-col group hover:border-[#00c2b2]/30 transition-colors">
                  <div className="h-10 w-10 rounded bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">用数据看清问题</h3>
                  <p className="text-gray-400 text-sm">
                    你会看到胜率趋势、近 30 笔对比等关键指标。
                    重点不是“好看”，而是让你知道：问题出在策略、执行，还是心态。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Scenario */}
          <section className="py-20 border-y border-white/5 bg-[#0a0a0a]">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00c2b2]/20 bg-[#00c2b2]/5 text-xs font-medium text-[#00c2b2] mb-6">
                    <Zap className="h-4 w-4" />
                    工作流自动化
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    场景示范：自动化闭环
                  </h2>
                  <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                    你不需要“复制粘贴、手动整理、到处记笔记”。
                    从信号到入库，系统可以帮你把流程跑起来：提醒同步到 Telegram 群，自动生成分析报告，最后变成可管理的交易记录。
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      延迟
                    </span>
                    <span className="text-2xl font-mono text-white font-bold">
                      &lt; 200ms
                    </span>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      稳定性
                    </span>
                    <span className="text-2xl font-mono text-white font-bold">
                      99.9%
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative mt-12">
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2 z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00c2b2]/50 to-transparent w-1/3" style={{ animation: "flowHorizontal 3s linear infinite", opacity: 0.5 }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                  {/* STEP 01 */}
                  <div className="group relative fade-in-up delay-100">
                    <div className="glass-card glow-hover rounded-xl p-6 h-full transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                      <div className="absolute -top-3 left-6 px-2 bg-[#0f0f11] text-xs text-[#00c2b2] border border-[#00c2b2]/20 rounded-md font-mono">
                        第 01 步
                      </div>
                      <div className="mb-6 flex justify-between items-start">
                        <div className="h-10 w-10 rounded bg-[#131722] border border-white/5 flex items-center justify-center text-white">
                          <Webhook className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                      <h4 className="text-white font-bold mb-2">TradingView 提醒触发</h4>
                      <div className="bg-[#1e222d] rounded p-3 border border-white/5 font-mono text-[10px] text-gray-400 mb-2">
                        <div className="text-green-400">提醒：BTC 做多</div>
                        <div className="truncate">msg: {"{\"ticker\":\"BTC\",\"px\":42100}"}</div>
                      </div>
                      <p className="text-xs text-gray-500">TradingView 把提醒发送到 webhook 地址。</p>
                    </div>
                  </div>

                  {/* STEP 02 */}
                  <div className="group relative fade-in-up delay-200">
                    <div className="glass-card glow-hover rounded-xl p-6 h-full transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                      <div className="absolute -top-3 left-6 px-2 bg-[#0f0f11] text-xs text-gray-400 border border-white/10 rounded-md font-mono">
                        第 02 步
                      </div>
                      <div className="mb-6 flex justify-between items-start">
                        <div className="h-10 w-10 rounded bg-[#24A1DE]/10 border border-[#24A1DE]/20 flex items-center justify-center text-[#24A1DE]">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                      <h4 className="text-white font-bold mb-2">推送到 Telegram 群</h4>
                      <div className="bg-[#1c242d] rounded-lg p-3 border border-white/5 relative mb-2">
                        <div className="absolute -left-1 top-3 w-2 h-2 bg-[#1c242d] rotate-45 border-l border-b border-white/5" />
                        <div className="text-[10px] text-gray-300">收到信号 ⚡️</div>
                        <div className="text-[10px] text-gray-500 mt-1">正在生成可读内容…</div>
                      </div>
                      <p className="text-xs text-gray-500">群里成员同步看到同一条提醒，信息不丢。</p>
                    </div>
                  </div>

                  {/* STEP 03 */}
                  <div className="group relative fade-in-up delay-300">
                    <div className="glass-card glow-hover rounded-xl p-6 h-full transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                      <div className="absolute -top-3 left-6 px-2 bg-[#0f0f11] text-xs text-cyan-300 border border-cyan-300/20 rounded-md font-mono">
                        第 03 步
                      </div>
                      <div className="mb-6 flex justify-between items-start">
                        <div className="h-10 w-10 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse">
                          <Brain className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                      <h4 className="text-white font-bold mb-2">OpenClaw 自动分析</h4>
                      <div className="space-y-1.5 mb-2">
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-3/4" />
                        </div>
                        <div className="h-1.5 w-2/3 bg-white/10 rounded-full" />
                        <div className="h-1.5 w-5/6 bg-white/10 rounded-full" />
                      </div>
                      <p className="text-xs text-gray-500">自动整理关键点：计划、风险、执行建议。</p>
                    </div>
                  </div>

                  {/* STEP 04 */}
                  <div className="group relative fade-in-up delay-400">
                    <div className="glass-card glow-hover rounded-xl p-6 h-full transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                      <div className="absolute -top-3 left-6 px-2 bg-[#0f0f11] text-xs text-gray-400 border border-white/10 rounded-md font-mono">
                        第 04 步
                      </div>
                      <div className="mb-6 flex justify-between items-start">
                        <div className="flex -space-x-2">
                          <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 z-10">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div className="h-10 w-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                      <h4 className="text-white font-bold mb-2">多渠道同步</h4>
                      <div className="flex gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          邮件
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          群内摘要
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">报告发到邮箱，关键结论同步回群里。</p>
                    </div>
                  </div>

                  {/* FINISH */}
                  <div className="group relative fade-in-up delay-400">
                    <div className="bg-gradient-to-br from-[#0f0f11] to-[#00c2b2]/5 border border-[#00c2b2]/30 rounded-xl p-6 h-full transition-all duration-300 hover:scale-[1.05] shadow-[0_0_30px_-10px_rgba(0,194,178,0.15)]">
                      <div className="absolute -top-3 left-6 px-2 bg-[#0f0f11] text-xs text-[#00c2b2] border border-[#00c2b2]/20 rounded-md font-mono font-bold">
                        完成
                      </div>
                      <div className="mb-6 flex justify-between items-start">
                        <div className="h-10 w-10 rounded bg-[#00c2b2] text-black flex items-center justify-center shadow-[0_0_25px_-5px_rgba(0,194,178,0.25)]">
                          <Database className="h-5 w-5" />
                        </div>
                      </div>
                      <h4 className="text-white font-bold mb-2">自动建档</h4>
                      <div className="bg-black/40 rounded border border-[#00c2b2]/20 p-2 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] text-white font-mono">Trade 已创建</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#00c2b2] h-full w-full" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">交易生命周期在平台里自动开启，后续可继续补全与管理。</p>
                    </div>
                  </div>
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
