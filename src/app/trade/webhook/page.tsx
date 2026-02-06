"use client";

import React from "react";
import TradePageShell from "../components/trade-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/components/common/alert";
import { Copy, Info } from "lucide-react";

function envApiBaseUrl() {
  // NEXT_PUBLIC_* is available in client bundle.
  return process.env.NEXT_PUBLIC_API_BASE_URL || "";
}

function normalizeApiBaseUrl(url: string) {
  if (!url) return "";
  return url.endsWith("/") ? url : url + "/";
}

export default function TradeWebhookPage() {
  const [, successAlert] = useAlert();
  const [apiBaseUrl, setApiBaseUrl] = React.useState(() =>
    normalizeApiBaseUrl(envApiBaseUrl()),
  );

  const [webhookSecret, setWebhookSecret] = React.useState("");
  const [telegramSecret, setTelegramSecret] = React.useState("");

  const telegramWebhookUrl = apiBaseUrl ? `${apiBaseUrl}webhook/telegram` : "";
  const tradeAlertUrl = apiBaseUrl ? `${apiBaseUrl}webhook/trade-alert` : "";

  const setWebhookCurl = telegramWebhookUrl
    ? `curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "url": "${telegramWebhookUrl}",
    "secret_token": "${telegramSecret || "<TELEGRAM_WEBHOOK_SECRET>"}"
  }'`
    : "";

  const tradeAlertCurl = tradeAlertUrl
    ? `curl -X POST "${tradeAlertUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-webhook-secret: ${webhookSecret || "<WEBHOOK_SECRET>"}" \\\n  -d '{"userId":"<USER_ID>","message":"hello from webhook"}'`
    : "";

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    successAlert("已复制到剪贴板");
  };

  return (
    <TradePageShell title="Webhook 配置/联调">
      <div className="space-y-6">
        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-[#00c2b2]" />
            说明
          </h3>
          <p className="mt-2 text-sm text-[#9ca3af]">
            这个页面主要用于“把命令拼好 + 复制粘贴”。密钥不会在浏览器端保存。
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">API Base URL</div>
              <Input
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(normalizeApiBaseUrl(e.target.value))}
                placeholder="例如 https://jygxccqnul.execute-api.ap-southeast-1.amazonaws.com/dev/"
                className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
              />
              <div className="mt-2 text-xs text-[#9ca3af]">
                默认读取 NEXT_PUBLIC_API_BASE_URL（本地 .env）。
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">WEBHOOK_SECRET</div>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="用于 /webhook/trade-alert header: x-webhook-secret"
                  className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                />
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">
                  TELEGRAM_WEBHOOK_SECRET
                </div>
                <Input
                  value={telegramSecret}
                  onChange={(e) => setTelegramSecret(e.target.value)}
                  placeholder="用于 Telegram setWebhook secret_token"
                  className="bg-[#1e1e1e] border border-[#27272a] text-[#e5e7eb]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">1) Telegram setWebhook</h3>
            <Button
              variant="secondary"
              onClick={() => copyText(setWebhookCurl)}
              disabled={!setWebhookCurl}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制命令
            </Button>
          </div>
          <p className="mt-2 text-sm text-[#9ca3af]">
            在任意终端执行该命令，把 Telegram bot 的 webhook 指向后端。
          </p>

          <pre className="mt-4 overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
            {setWebhookCurl || "请先填写 API Base URL"}
          </pre>
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">2) 触发推送（trade-alert）</h3>
            <Button
              variant="secondary"
              onClick={() => copyText(tradeAlertCurl)}
              disabled={!tradeAlertCurl}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制命令
            </Button>
          </div>
          <p className="mt-2 text-sm text-[#9ca3af]">
            外部系统只需要 POST 这个接口并带上 x-webhook-secret，就会推送到已绑定的 chatId。
          </p>

          <pre className="mt-4 overflow-x-auto rounded-lg border border-[#27272a] bg-black/30 p-4 text-xs text-white whitespace-pre">
            {tradeAlertCurl || "请先填写 API Base URL"}
          </pre>
        </div>

        <div className="bg-[#121212] rounded-xl border border-[#27272a] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white">验收 checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#9ca3af] list-disc pl-5">
            <li>后端 env 已配置：TELEGRAM_BOT_TOKEN / USERNAME / BIND_SECRET / TELEGRAM_WEBHOOK_SECRET / WEBHOOK_SECRET</li>
            <li>已在 Telegram setWebhook 指向 dev/prod 的 /webhook/telegram</li>
            <li>先在“Telegram 绑定”页完成绑定</li>
            <li>用上面的 trade-alert curl 发送测试消息</li>
          </ul>
        </div>
      </div>
    </TradePageShell>
  );
}
