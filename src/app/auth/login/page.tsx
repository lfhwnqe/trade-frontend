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
      router.push("/");
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md bg-background rounded-xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-2">登录</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              邮箱
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="请输入邮箱"
              value={form.email}
              autoComplete="email"
              required
              onChange={handleChange}
              aria-invalid={!!form.error}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium"
            >
              密码
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="请输入密码"
              value={form.password}
              autoComplete="current-password"
              required
              minLength={8}
              onChange={handleChange}
              aria-invalid={!!form.error}
            />
          </div>
          {form.error && (
            <div className="text-destructive text-sm py-1 text-center">
              {form.error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={form.isLoading}>
            {form.isLoading ? "登录中..." : "登录"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-2">
          还没有账号？{" "}
          <Link
            href="/auth/register"
            className="text-primary font-medium hover:underline"
          >
            注册新账号
          </Link>
        </div>
      </div>
    </div>
  );
}
