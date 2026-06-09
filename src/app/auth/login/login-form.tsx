"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { userAtom } from "@/store/user";
import { loginFormAtom } from "./atom";

export function LoginForm() {
  const [form, setForm] = useAtomImmer(loginFormAtom);
  const [, setUser] = useAtomImmer(userAtom);
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

      setUser((draft) => {
        draft.username = data.username || "";
        draft.email = data.email || form.email;
        draft.role = data.role;
      });

      const redirectPath = window.localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        window.localStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath);
        return;
      }

      router.push("/trade/home");
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
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-white/60">
            账号 / 邮箱
          </label>
          <Input
            type="text"
            id="email"
            name="email"
            placeholder="name@company.com 或你的用户名"
            value={form.email}
            autoComplete="username"
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
          <div className="text-center text-sm text-red-400">{form.error}</div>
        )}
        <Button
          type="submit"
          className="h-12 w-full bg-gradient-to-r from-[#00c2b2] to-[#009e91] font-semibold text-black hover:brightness-110"
          disabled={form.isLoading}
        >
          {form.isLoading ? "登录中..." : "登录"}
        </Button>

        <div className="flex items-center justify-between text-sm text-white/60">
          <span />
          <Link
            prefetch
            href="/auth/forgot"
            className="font-medium text-[#00c2b2] hover:text-[#00a89c]"
          >
            忘记密码？
          </Link>
        </div>
      </form>
      <div className="mt-6 text-center text-sm text-white/60">
        还没有账号？
        <Link
          prefetch
          href="/auth/register"
          className="ml-2 font-medium text-[#00c2b2] hover:text-[#00a89c]"
        >
          注册新账号
        </Link>
      </div>
    </>
  );
}
