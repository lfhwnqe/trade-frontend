import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import HomeAuthCta from "@/components/home-auth-cta";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Coins,
  Droplet,
  Gem,
  Mountain,
  RefreshCw,
  Share2,
  TrendingUp,
  Zap,
} from "lucide-react";
import Image from "next/image";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function Home() {
  return (
    <div
      className={`min-h-screen bg-[#0a0a0a] text-white ${spaceGrotesk.className}`}
    >
      <style>{`
        :root {
          color-scheme: dark;
        }
        .grid-bg {
          background-size: 40px 40px;
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #00c2b2;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 grid-bg opacity-30" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center text-[#00c2b2]">
                {/* <LineChart className="h-7 w-7" /> */}
                <Image
                  src={`/favicon.png`}
                  width={30}
                  height={30}
                  alt="Picture of the author"
                ></Image>
              </div>
              <span className="text-xl font-bold tracking-tight">
                MMCTradeJournal
              </span>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <a
                className="text-sm font-medium transition-colors hover:text-[#00c2b2]"
                href="#"
              >
                产品功能
              </a>
              <a
                className="text-sm font-medium transition-colors hover:text-[#00c2b2]"
                href="#"
              >
                复盘框架
              </a>
              <a
                className="text-sm font-medium transition-colors hover:text-[#00c2b2]"
                href="#"
              >
                方案与价格
              </a>
              <Link
                className="text-sm font-medium transition-colors hover:text-[#00c2b2]"
                href="/docs"
              >
                文档
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <HomeAuthCta />
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <section className="relative overflow-hidden pb-32 pt-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#00c2b2]/10 blur-[120px]" />
            <div className="container mx-auto px-4 md:px-6">
              <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center gap-8 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00c2b2]/20 bg-[#00c2b2]/5 px-3 py-1 text-xs font-medium text-[#00c2b2]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00c2b2] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00c2b2]" />
                  </span>
                  v1.0 正式发布：可视化复盘与绩效归因
                </div>
                <h1 className="text-5xl font-bold leading-tight tracking-tighter md:text-7xl">
                  把交易变成可复用的经验。
                  <br />
                  <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                    用数据复盘，持续提升盈利。
                  </span>
                </h1>
                <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
                  一站式交易复盘系统：自动记录订单与关键截图，量化执行与风险，定位亏损来源，形成可执行的改进清单。
                </p>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                  <button className="flex h-12 items-center justify-center gap-2 rounded bg-[#00c2b2] px-8 text-lg font-bold text-black transition-all hover:bg-[#009e91]">
                    立即开始免费复盘
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="flex h-12 items-center justify-center rounded border border-white/20 px-8 font-medium transition-all hover:bg-white/5">
                    观看产品演示
                  </button>
                </div>
              </div>

              <div className="perspective-1000 group relative mx-auto w-full max-w-6xl">
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121212]/80 shadow-2xl transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.01]">
                  <div className="flex h-10 items-center gap-2 border-b border-white/5 bg-white/5 px-4">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                    <div className="ml-4 flex h-6 w-96 items-center rounded bg-white/5 px-3 text-xs font-mono text-gray-500">
                      https://trade.maomaocong.com/
                    </div>
                  </div>
                  <div className="relative aspect-video w-full bg-[#0a0a0a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="交易复盘仪表盘：K线回放、交易标注与核心绩效指标一屏呈现"
                      className="h-full w-full object-cover opacity-90"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBwgUGn6geldT9bVd_pzVfzYT0XTZDzKCOcxXRxNxLD-qUfDgVN7udoC6A4Crd1P7NBG2rX4-77rd4IkRc3chKNdi1fu91H2yQbi4oWQgzP1D3U7G_NGlkdx8vdsZBzjblAacM5kYKyAmqJHAQ_nvFxXCrc3PxazISAmEeIsM71-c15uagwyNhCN_tqX4-XxzsdQ4ijVQavf_tllakFq7i9diO8VI7FuleltmtdsNkLhptyqzcjxwdkJPyiUUM1Qnx4GErfvuj4g"
                    />
                    <div className="absolute right-6 top-6 w-64 rounded-lg border border-white/10 bg-[#121212]/90 p-4 shadow-lg backdrop-blur">
                      <div className="mb-1 text-xs text-gray-400">今日盈亏</div>
                      <div className="text-2xl font-bold text-[#00c2b2]">
                        +¥8,640.50
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[75%] bg-[#00c2b2]" />
                      </div>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-gray-400">胜率</span>
                        <span className="text-white">68%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="absolute -bottom-6 -right-6 z-20 flex items-center gap-3 rounded-lg border border-white/10 bg-[#121212] p-4 shadow-xl md:-right-12"
                  style={{ animation: "bounce 3s infinite" }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">效率评分</div>
                    <div className="font-bold text-white">94.2/100</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="w-full border-y border-white/5 bg-[#121212] py-3">
            <div className="flex gap-12 whitespace-nowrap text-sm font-mono opacity-60 animate-pulse">
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">BTC/USD</span> 45,230.00
                <span className="text-xs text-[#00c2b2]">▲ 2.4%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-red-400">ETH/USD</span> 2,340.50
                <span className="text-xs text-red-400">▼ 0.8%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">ES_F</span> 4,890.25
                <span className="text-xs text-[#00c2b2]">▲ 0.4%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">NQ_F</span> 17,200.00
                <span className="text-xs text-[#00c2b2]">▲ 0.6%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-red-400">EUR/USD</span> 1.0924
                <span className="text-xs text-red-400">▼ 0.1%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">XAU/USD</span> 2,045.10
                <span className="text-xs text-[#00c2b2]">▲ 1.1%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">TSLA</span> 240.50
                <span className="text-xs text-[#00c2b2]">▲ 3.2%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#00c2b2]">NVDA</span> 550.00
                <span className="text-xs text-[#00c2b2]">▲ 1.5%</span>
              </span>
            </div>
          </div>

          <section className="relative bg-[#0a0a0a] py-24">
            <div className="container mx-auto px-4 md:px-6">
              <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl">
                  <h2 className="mb-4 text-3xl font-bold md:text-5xl">
                    复盘不是记流水账，而是找到可复制的优势
                  </h2>
                  <p className="text-gray-400">
                    把交易数据、执行行为与情绪记录整合在一起，自动生成绩效归因与训练重点，让你每天都知道该优化什么。
                  </p>
                </div>
                <a
                  className="flex items-center gap-2 font-bold text-[#00c2b2] hover:text-[#009e91]"
                  href="#"
                >
                  查看功能清单 <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid grid-cols-1 gap-6 auto-rows-[minmax(200px,auto)] md:grid-cols-3">
                <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-8 transition-colors hover:border-[#00c2b2]/50 md:col-span-2">
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#00c2b2]/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#00c2b2]/10 text-[#00c2b2]">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold">绩效归因分析</h3>
                    <p className="max-w-sm text-gray-400">
                      按策略 / 品种 / 方向 / 时段拆解收益，自动计算期望值、盈利因子、最大回撤、夏普比率与稳定性，明确你的优势来源。
                    </p>
                  </div>
                  <div className="mt-8 flex h-32 items-end gap-1 opacity-50">
                    <div className="h-[40%] w-full rounded-t-sm bg-[#00c2b2]/20" />
                    <div className="h-[60%] w-full rounded-t-sm bg-[#00c2b2]/40" />
                    <div className="h-[30%] w-full rounded-t-sm bg-[#00c2b2]/60" />
                    <div className="h-[80%] w-full rounded-t-sm bg-[#00c2b2]/80" />
                    <div className="h-[50%] w-full rounded-t-sm bg-[#00c2b2]" />
                    <div className="h-[90%] w-full rounded-t-sm bg-[#00c2b2]/70" />
                    <div className="h-[45%] w-full rounded-t-sm bg-[#00c2b2]/40" />
                  </div>
                </div>

                <div className="group flex flex-col rounded-2xl border border-white/10 bg-[#121212] p-8 transition-colors hover:border-[#00c2b2]/50 md:row-span-2">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">心态与纪律追踪</h3>
                  <p className="mb-8 text-gray-400">
                    进出场前后记录情绪与触发因素，识别冲动交易、规则偏离与报复性操作如何影响最终收益。
                  </p>
                  <div className="flex-grow space-y-3 rounded-lg border border-white/5 bg-[#0a0a0a]/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">冷静执行</span>
                      <span className="ml-auto text-xs text-gray-500">
                        平均收益 +¥1,680
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-sm">犹豫观望</span>
                      <span className="ml-auto text-xs text-gray-500">
                        平均收益 -¥350
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-sm">报复性操作</span>
                      <span className="ml-auto text-xs text-gray-500">
                        平均收益 -¥3,150
                      </span>
                    </div>
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <div className="text-xs font-mono text-indigo-400">
                        行为洞察：
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        你在 9:30–10:30 的交易期望值显著更高，适合重点加大执行训练。
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group flex flex-col rounded-2xl border border-white/10 bg-[#121212] p-8 transition-colors hover:border-[#00c2b2]/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">交易数据自动导入</h3>
                  <p className="text-sm text-gray-400">
                    连接主流交易平台与交易所，一键同步订单、成交、手续费与持仓变化，减少手动记录误差。
                  </p>
                </div>

                <div className="group flex flex-col rounded-2xl border border-white/10 bg-[#121212] p-8 transition-colors hover:border-[#00c2b2]/50">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">复盘共享与督导</h3>
                  <p className="text-sm text-gray-400">
                    向导师/同伴分享只读复盘链接，对关键交易添加标注与建议，形成可追踪的改进闭环。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-white/5 bg-[#121212] py-16">
            <div className="container mx-auto px-4 text-center">
              <p className="mb-8 text-sm font-bold uppercase tracking-widest text-gray-500">
                为活跃交易者打造的专业复盘工具
              </p>
              <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-500 hover:grayscale-0">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Gem className="h-6 w-6" /> CapitalTrade
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Zap className="h-6 w-6" /> SwiftExec
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Droplet className="h-6 w-6" /> AlphaFlow
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Mountain className="h-6 w-6" /> PeakView
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Coins className="h-6 w-6" /> TokenMetrics
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden py-32">
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a0a] to-[#121212]" />
            <div className="absolute inset-0 z-0 grid-bg opacity-20" />
            <div className="container mx-auto relative z-10 px-4">
              <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121212] to-black p-12 text-center shadow-2xl md:p-20">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c2b2]/20 blur-[100px]" />
                <h2 className="relative z-10 mb-6 text-4xl font-bold md:text-6xl">
                  准备把交易做成可持续进步的系统？
                </h2>
                <p className="relative z-10 mx-auto mb-10 max-w-2xl text-xl text-gray-400">
                  从下一笔交易开始，用数据验证策略，用复盘优化执行，让盈利来自系统，而不是运气。
                </p>
                <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
                  <button className="h-14 rounded bg-[#00c2b2] px-10 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-[#009e91]">
                    开启 14 天免费试用
                  </button>
                  <button className="h-14 rounded border border-white/10 px-10 text-lg font-medium text-white transition-all hover:bg-white/5">
                    查看方案与价格
                  </button>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  无需信用卡，14 天内可随时取消。
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-[#121212] pb-10 pt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
              <div className="col-span-2 lg:col-span-2">
                <div className="mb-6 flex items-center gap-2">
                  {/* <LineChart className="h-8 w-8 text-[#00c2b2]" /> */}
                   <Image
                  src={`/favicon.png`}
                  width={30}
                  height={30}
                  alt="Picture of the author"
                ></Image>
                  <span className="text-xl font-bold">MMCTradeJournal</span>
                </div>
                <p className="mb-6 max-w-sm text-gray-400">
                  以数据为核心的交易复盘系统：记录—分析—改进—验证，帮助你建立长期稳定的交易流程。
                </p>
                <div className="flex gap-4">
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded bg-white/5 transition-colors hover:bg-[#00c2b2] hover:text-black"
                    href="#"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded bg-white/5 transition-colors hover:bg-[#00c2b2] hover:text-black"
                    href="#"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="mb-4 font-bold">产品中心</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      功能清单
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      方案与价格
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      平台集成
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      更新日志
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-bold">学习资源</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>
                    <Link
                      className="transition-colors hover:text-[#00c2b2]"
                      href="/docs"
                    >
                      文档
                    </Link>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      社区
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      博客
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-bold">关于</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      团队与愿景
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      加入团队
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      法律与合规
                    </a>
                  </li>
                  <li>
                    <a
                      className="transition-colors hover:text-[#00c2b2]"
                      href="#"
                    >
                      联系我们
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-gray-500 md:flex-row">
              <p>
                © {new Date().getFullYear()} MMCTradeJournal Systems Inc.
                保留所有权利。
              </p>
              <div className="flex gap-6">
                <a className="transition-colors hover:text-white" href="#">
                  隐私与数据安全
                </a>
                <a className="transition-colors hover:text-white" href="#">
                  服务协议
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
