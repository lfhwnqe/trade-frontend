"use client";

import * as React from "react";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { formAtom } from "./atom";
import Image from "next/Image";

export default function VerifyPage() {
  const [form, setForm] = useAtomImmer(formAtom);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 页面加载自动填充用户名
  useEffect(() => {
    const uname = searchParams.get("username");
    if (uname)
      setForm((draft) => {
        draft.username = uname;
      });
  }, [searchParams, setForm]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setForm((draft) => {
      draft.isLoading = true;
      draft.error = "";
      draft.message = "";
    });

    if (!form.username || !form.code) {
      setForm((draft) => {
        draft.error = "用户名和验证码均不能为空";
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
            targetPath: "user/confirm",
            actualMethod: "POST",
          },
          body: {
            username: form.username,
            code: form.code,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "验证码确认失败");
      }

      setForm((draft) => {
        draft.message = data.message || "账号已成功验证，现在可以登录。";
      });
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    } catch (err) {
      setForm((draft) => {
        draft.error =
          err instanceof Error ? err.message : "验证码确认发生未知错误";
      });
    } finally {
      setForm((draft) => {
        draft.isLoading = false;
      });
    }
  };

  return (
    <Suspense fallback={<div>加载中...</div>}>
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
                    Verify Access
                  </span>
                  <h2 className="text-4xl font-semibold leading-tight">
                    Activate
                    <br />
                    <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                      Your Account.
                    </span>
                  </h2>
                  <p className="mt-4 text-base text-white/60">
                    Confirm your email to unlock your personalized trading
                    workspace.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex h-28 w-full items-end gap-1 opacity-60">
                    {[25, 42, 60, 72, 50, 38, 63, 82, 57].map(
                      (value, index) => (
                        <div
                          key={`bar-${value}-${index}`}
                          className="flex-1 rounded-t bg-[#00c2b2]"
                          style={{
                            height: `${value}%`,
                            opacity: 0.2 + index * 0.08,
                          }}
                        />
                      ),
                    )}
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">
                    <span>Security Check</span>
                    <span className="text-[#00c2b2]">99.9% uptime</span>
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
                    src={`/favicon.ico`}
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
                <h1 className="text-3xl font-semibold">账号验证</h1>
                <p className="mt-2 text-white/50">
                  输入用户名与邮箱验证码完成激活。
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
                    value={form.username}
                    autoFocus
                    required
                    minLength={3}
                    maxLength={64}
                    onChange={(e) =>
                      setForm((draft) => {
                        draft.username = e.target.value;
                      })
                    }
                    aria-invalid={!!form.error}
                    autoComplete="username"
                    placeholder="请输入用户名"
                    className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm text-white/60">
                    验证码
                  </label>
                  <Input
                    id="code"
                    name="code"
                    value={form.code}
                    required
                    minLength={4}
                    maxLength={10}
                    onChange={(e) =>
                      setForm((draft) => {
                        draft.code = e.target.value;
                      })
                    }
                    aria-invalid={!!form.error}
                    autoComplete="one-time-code"
                    placeholder="请输入邮箱中的验证码"
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
                  {form.isLoading ? "验证中..." : "确认"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-white/60">
                未收到验证码？请检查邮箱垃圾箱或
                <a
                  href="/auth/register"
                  className="ml-2 font-medium text-[#00c2b2] hover:text-[#00a89c]"
                >
                  重新注册
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Suspense>
  );
}
