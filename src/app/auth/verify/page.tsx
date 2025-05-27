"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { formAtom } from "./atom";

export default function VerifyPage() {
  const [form, setForm] = useAtomImmer(formAtom);

  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // 页面加载自动填充用户名
  React.useEffect(() => {
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
          targetPath: "user/confirm",
          actualMethod: "POST",
          username: form.username,
          code: form.code,
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div
        className={`w-full ${
          isMobile
            ? "max-w-full rounded-none shadow-none px-3"
            : "max-w-md rounded-xl shadow-md px-8"
        } bg-background p-6 space-y-6`}
      >
        <h1 className="text-2xl font-bold text-center mb-2">注册账号激活</h1>
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
            />
          </div>
          <div>
            <label htmlFor="code" className="block mb-1 text-sm font-medium">
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
            {form.isLoading ? "验证中..." : "确认"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-2">
          未收到验证码？请检查邮箱垃圾箱或
          <a
            href="/auth/register"
            className="text-primary font-medium hover:underline ml-2"
          >
            重新注册
          </a>
        </div>
      </div>
    </div>
  );
}
