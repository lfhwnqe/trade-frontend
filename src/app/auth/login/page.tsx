"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginFormAtom } from "./atom";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useAtomImmer(loginFormAtom);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email" || name === "password") {
      setForm((draft) => {
        draft[name] = value;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setForm((draft) => {
      draft.isLoading = true;
      draft.error = "";
    });

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "登录失败");
      }

      // 登录成功后跳转回之前想访问的页面（如果有），否则首页
      if (typeof window !== "undefined") {
        const redirectPath = window.localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          window.localStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
          return;
        }
      }
      router.push("/trade/home");
      // router.push("/");
    } catch (err) {
      setForm((draft) => {
        draft.error = err instanceof Error ? err.message : "出现未知错误。";
      });
    } finally {
      setForm((draft) => {
        draft.isLoading = false;
      });
    }
  };

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
                      style={{ height: `${value}%`, opacity: 0.2 + index * 0.08 }}
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
                <span className="text-sm font-bold">TJ</span>
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
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-white/60">
                  邮箱
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@company.com"
                  value={form.email}
                  autoComplete="email"
                  required
                  onChange={handleChange}
                  aria-invalid={!!form.error}
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-white/60">
                  密码
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  onChange={handleChange}
                  aria-invalid={!!form.error}
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>
              {form.error && (
                <div className="text-center text-sm text-red-400">
                  {form.error}
                </div>
              )}
              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-[#00c2b2] to-[#009e91] font-semibold text-black hover:brightness-110"
                disabled={form.isLoading}
              >
                {form.isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-white/60">
              还没有账号？
              <Link
                href="/auth/register"
                className="ml-2 font-medium text-[#00c2b2] hover:text-[#00a89c]"
              >
                注册新账号
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
