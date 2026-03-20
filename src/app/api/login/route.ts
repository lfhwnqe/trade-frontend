import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ message: "API配置错误" }, { status: 500 });
    }

    // 向后端登录接口转发
    const backendResponse = await fetch(apiBaseUrl + "user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: requestBody.email,
        password: requestBody.password,
      }),
    });

    const data = await backendResponse.json();
    console.log("🌹data:", data);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "登录失败" },
        { status: backendResponse.status },
      );
    }

    // 将后端返回的 token 写入 HTTP-only cookie，供后续代理请求透传给后端
    const response = NextResponse.json({
      message: "登录成功",
      ...data,
    });
    const isSecureCookie = process.env.NODE_ENV === "production";

    if (data.accessToken) {
      response.cookies.set("token", data.accessToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: "lax",
        path: "/",
        // maxAge: 可定制
      });
    }
    if (data.refreshToken) {
      response.cookies.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: "lax",
        path: "/",
        // maxAge: 可定制（通常 refresh token 生命周期更长）
      });
    }
    if (data.idToken) {
      response.cookies.set("idToken", data.idToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (error) {
    console.error("登录接口服务异常:", error);
    return NextResponse.json({ message: "登录接口服务异常" }, { status: 502 });
  }
}
