"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { formAtom } from "./atom";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useAtomImmer(formAtom);
  const router = useRouter();
  const isMobile = useIsMobile();

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
            actualMethod: "POST"
          },
          body: {
            username: form.username,
            email: form.email,
            password: form.password
          }
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div
        className={`w-full ${
          isMobile
            ? "max-w-full rounded-none shadow-none px-3"
            : "max-w-md rounded-xl shadow-md px-8"
        } bg-background p-6 space-y-6`}
      >
        <h1 className="text-2xl font-bold text-center mb-2">注册</h1>
        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label
              htmlFor="username"
              className="block mb-1 text-sm font-medium"
            >
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
            />
          </div>
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
              required
              onChange={(e) =>
                setForm((draft) => {
                  draft.email = e.target.value;
                })
              }
              aria-invalid={!!form.error}
              autoComplete="email"
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
              minLength={8}
              required
              onChange={(e) =>
                setForm((draft) => {
                  draft.password = e.target.value;
                })
              }
              aria-invalid={!!form.error}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block mb-1 text-sm font-medium"
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
            />
          </div>
          {form.error && (
            <div className="text-destructive text-sm py-1 text-center">
              {form.error}
            </div>
          )}
          {form.message && (
            <div className="text-green-600 text-sm py-1 text-center">
              {form.message}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={form.isLoading}>
            {form.isLoading ? "注册中..." : "注册"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-2">
          已有账号？{" "}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
