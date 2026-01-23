"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { formAtom } from "./atom";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useAtomImmer(formAtom);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setForm((draft) => {
      draft.isLoading = true;
      draft.error = "";
      draft.message = "";
    });

    if (form.password !== form.confirmPassword) {
      setForm((draft) => {
        draft.error = "两次输入的密码不一致。";
        draft.isLoading = false;
      });
      return;
    }

    try {
      const response = await fetch("/api/proxy-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: {
            targetPath: "user/register",
            actualMethod: "POST",
          },
          body: {
            username: form.username,
            email: form.email,
            password: form.password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "注册失败");
      }

      setForm((draft) => {
        draft.message = data.message || "注册成功！请查收邮箱验证码完成激活。";
      });
      // 注册成功后自动跳转到验证页面并带上用户名
      router.push(`/auth/verify?username=${encodeURIComponent(form.username)}`);
    } catch (err) {
      setForm((draft) => {
        draft.error =
          err instanceof Error ? err.message : "注册过程中出现未知异常。";
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
                  Start Tracking
                </span>
                <h2 className="text-4xl font-semibold leading-tight">
                  Build Your
                  <br />
                  <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                    Edge.
                  </span>
                </h2>
                <p className="mt-4 text-base text-white/60">
                  Create an account to record every trade, insight, and
                  milestone with precision.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex h-28 w-full items-end gap-1 opacity-60">
                  {[20, 45, 55, 75, 48, 35, 68, 88, 52].map((value, index) => (
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
                  <span>Daily Focus</span>
                  <span className="text-[#00c2b2]">+8.1% WoW</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex w-full items-center justify-center p-6 md:p-12 lg:w-1/2 lg:p-24">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2b2] to-white text-black">
                {/* <span className="text-sm font-bold">TJ</span> */}
                <Image
                  src={`/favicon.png`}
                  width={30}
                  height={30}
                  alt="Picture of the author"
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
              <h1 className="text-3xl font-semibold">创建账号</h1>
              <p className="mt-2 text-white/50">
                填写信息以开启你的交易记录旅程。
              </p>
            </div>
            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm text-white/60">
                  用户名
                </label>
                <Input
                  id="username"
                  name="username"
                  placeholder="请输入用户名"
                  minLength={3}
                  value={form.username}
                  required
                  onChange={(e) =>
                    setForm((draft) => {
                      draft.username = e.target.value;
                    })
                  }
                  aria-invalid={!!form.error}
                  autoComplete="username"
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>
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
                  required
                  onChange={(e) =>
                    setForm((draft) => {
                      draft.email = e.target.value;
                    })
                  }
                  aria-invalid={!!form.error}
                  autoComplete="email"
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
                  placeholder="请输入密码"
                  value={form.password}
                  minLength={8}
                  required
                  onChange={(e) =>
                    setForm((draft) => {
                      draft.password = e.target.value;
                    })
                  }
                  aria-invalid={!!form.error}
                  autoComplete="new-password"
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm text-white/60"
                >
                  确认密码
                </label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="请再次输入密码"
                  value={form.confirmPassword}
                  minLength={8}
                  required
                  onChange={(e) =>
                    setForm((draft) => {
                      draft.confirmPassword = e.target.value;
                    })
                  }
                  aria-invalid={!!form.error}
                  autoComplete="new-password"
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>
              {form.error && (
                <div className="text-center text-sm text-red-400">
                  {form.error}
                </div>
              )}
              {form.message && (
                <div className="text-center text-sm text-emerald-400">
                  {form.message}
                </div>
              )}
              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-[#00c2b2] to-[#009e91] font-semibold text-black hover:brightness-110"
                disabled={form.isLoading}
              >
                {form.isLoading ? "注册中..." : "注册"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-white/60">
              已有账号？
              <Link
                prefetch
                href="/auth/login"
                className="ml-2 font-medium text-[#00c2b2] hover:text-[#00a89c]"
              >
                去登录
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
