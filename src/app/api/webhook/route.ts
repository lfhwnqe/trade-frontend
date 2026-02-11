import { NextRequest, NextResponse } from "next/server";

// Public proxy for TradingView webhook (no auth)
// POST /api/webhook?token=tw_xxx&tradeShortId=tr_xxx
// body: { message?: string, ... }
export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ message: "API配置错误" }, { status: 500 });
    }

    const token = request.nextUrl.searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ message: "token required" }, { status: 400 });
    }

    const tradeShortId = request.nextUrl.searchParams.get("tradeShortId") || "";

    const rawBody = await request.text();
    const incomingContentType = request.headers.get("content-type") || "";

    let forwardBody = rawBody;
    let forwardContentType = incomingContentType || "application/json";

    // Backend webhook expects JSON body with { message: string }.
    // TradingView may send plain text; normalize here for compatibility.
    if (!incomingContentType.toLowerCase().includes("application/json")) {
      forwardBody = JSON.stringify({
        message: rawBody?.trim() || "TradingView alert",
      });
      forwardContentType = "application/json";
    } else {
      try {
        const parsed = JSON.parse(rawBody || "{}");
        if (typeof parsed?.message !== "string" || !parsed.message.trim()) {
          forwardBody = JSON.stringify({
            ...parsed,
            message: rawBody?.trim() || "TradingView alert",
          });
        }
      } catch {
        forwardBody = JSON.stringify({
          message: rawBody?.trim() || "TradingView alert",
        });
        forwardContentType = "application/json";
      }
    }

    const backendPath = tradeShortId
      ? `webhook/trade-alert/${token}/${encodeURIComponent(tradeShortId)}`
      : `webhook/trade-alert/${token}`;

    const backendResp = await fetch(`${apiBaseUrl}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": forwardContentType,
      },
      body: forwardBody,
    });

    const respText = await backendResp.text();
    return new NextResponse(respText, {
      status: backendResp.status,
      headers: {
        "Content-Type": backendResp.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "proxy error";
    return NextResponse.json({ message }, { status: 502 });
  }
}
