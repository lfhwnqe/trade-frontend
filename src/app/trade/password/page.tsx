"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { LockKeyhole } from "lucide-react";

async function changePassword(oldPassword: string, newPassword: string) {
  const resp = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    credentials: "include",
    proxyParams: {
      targetPath: "user/password/change",
      actualMethod: "POST",
    },
    actualBody: {
      oldPassword,
      newPassword,
    },
  });

  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export default function TradeChangePasswordPage() {
  const [errorAlert, successAlert] = useAlert();

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async () => {
    if (saving) return;

    if (!oldPassword || !newPassword) {
      errorAlert("请填写旧密码和新密码");
      return;
    }

    if (newPassword !== confirmPassword) {
      errorAlert("两次输入的新密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      errorAlert("新密码长度至少 6 位");
      return;
    }

    try {
      setSaving(true);
      await changePassword(oldPassword, newPassword);
      successAlert("密码修改成功");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "修改失败";
      errorAlert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TradePageShell title="修改密码" subtitle="需要登录态（cookie token）" showAddButton={false}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#27272a] bg-[#121212] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00c2b2]/10 text-[#00c2b2]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">修改密码</div>
              <div className="mt-1 text-sm text-[#9ca3af]">
                密码策略由 Cognito 控制（通常需要大小写/数字等）。
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">旧密码</div>
              <Input
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                type="password"
                placeholder="输入旧密码"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">新密码</div>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="输入新密码"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-[#9ca3af]">确认新密码</div>
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="再次输入新密码"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#00c2b2] text-black hover:bg-[#00c2b2]/90"
            >
              {saving ? "提交中..." : "确认修改"}
            </Button>
            <div className="text-xs text-[#6b7280]">
              如果提示登录失效，请重新登录后再试。
            </div>
          </div>
        </div>
      </div>
    </TradePageShell>
  );
}
