import { NextRequest, NextResponse } from "next/server";

// Public proxy for TradingView webhook (no auth)
// POST /api/webhook?token=tw_xxx
// body: { message: string }
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

    const body = await request.text();

    const backendResp = await fetch(`${apiBaseUrl}webhook/trade-alert/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
      },
      body,
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
