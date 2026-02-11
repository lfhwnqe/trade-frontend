"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const resp = await fetch("/api/proxy-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            targetPath: "user/password/forgot",
            actualMethod: "POST",
          },
          body: { email },
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.message || "发送验证码失败");
      }

      setMessage("如果该邮箱已注册，我们已发送验证码。请查收邮箱。");
      router.push(`/auth/reset?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "出现未知错误。 ");
    } finally {
      setIsLoading(false);
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
                  Account Recovery
                </span>
                <h2 className="text-4xl font-semibold leading-tight">
                  Reset Your
                  <br />
                  <span className="bg-gradient-to-r from-[#00c2b2] to-white bg-clip-text text-transparent">
                    Access.
                  </span>
                </h2>
                <p className="mt-4 text-base text-white/60">
                  We’ll send a verification code to your email. Then you can set a new password.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex h-28 w-full items-end gap-1 opacity-60">
                  {[20, 55, 35, 70, 50, 40, 65, 80, 45].map((value, index) => (
                    <div
                      key={`bar-${value}-${index}`}
                      className="flex-1 rounded-t bg-[#00c2b2]"
                      style={{ height: `${value}%`, opacity: 0.2 + index * 0.08 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">
                  <span>Security First</span>
                  <span className="text-[#00c2b2]">Email Code</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex w-full items-center justify-center p-6 md:p-12 lg:w-1/2 lg:p-24">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2b2] to-white text-black">
                <Image src={`/favicon.png`} width={30} height={30} alt="logo" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  MMCTradeJournal
                </p>
                <p className="text-lg font-semibold">交易日志</p>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold">忘记密码</h1>
              <p className="mt-2 text-white/50">
                输入注册邮箱，我们会发送验证码用于重置密码。
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
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#00c2b2] focus-visible:ring-offset-0"
                />
              </div>

              {error ? (
                <div className="text-center text-sm text-red-400">{error}</div>
              ) : null}
              {message ? (
                <div className="text-center text-sm text-emerald-400">{message}</div>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-[#00c2b2] to-[#009e91] font-semibold text-black hover:brightness-110"
                disabled={isLoading}
              >
                {isLoading ? "发送中..." : "发送验证码"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/60">
              想起来了？
              <Link
                prefetch
                href="/auth/login"
                className="ml-2 font-medium text-[#00c2b2] hover:text-[#00a89c]"
              >
                返回登录
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
