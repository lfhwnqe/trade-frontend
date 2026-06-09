import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c2b2]/10 blur-[140px]" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="relative hidden w-1/2 items-center justify-center border-r border-white/5 p-12 lg:flex">
          <div className="relative z-10 w-full max-w-xl">
            <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_0_30px_-10px_rgba(0,194,178,0.35)] backdrop-blur-xl">
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-[#00c2b2]">
                  Market Access
                </span>
                <h2 className="text-4xl font-semibold leading-tight">
                  Welcome Back,
                  <br />
                  <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                    Trader.
                  </span>
                </h2>
                <p className="mt-4 text-base text-white/60">
                  Your edge is waiting. Access your dashboard and analyze
                  today&apos;s performance.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex h-28 w-full items-end gap-1 opacity-60">
                  {[30, 50, 45, 85, 60, 40, 70, 90, 55].map((value, index) => (
                    <div
                      key={`bar-${value}-${index}`}
                      className="flex-1 rounded-t bg-[#00c2b2]"
                      style={{
                        height: `${value}%`,
                        opacity: 0.2 + index * 0.08,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">
                  <span>Equity Curve</span>
                  <span className="text-[#00c2b2]">+12.4% MoM</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex w-full items-center justify-center p-6 md:p-12 lg:w-1/2 lg:p-24">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2b2] to-white text-black">
                <Image
                  src={`/favicon.png`}
                  width={30}
                  height={30}
                  alt="MMCTradeJournal"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  MMCTradeJournal
                </p>
                <p className="text-lg font-semibold">交易日志</p>
              </div>
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold">登录</h1>
              <p className="mt-2 text-white/50">
                输入账户信息以继续管理你的交易日志。
              </p>
            </div>
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
