import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ message: 'API配置错误' }, { status: 500 });
    }

    // 向后端登录接口转发
    const backendResponse = await fetch(apiBaseUrl + 'user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: requestBody.email,
        password: requestBody.password,
      }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || '登录失败' },
        { status: backendResponse.status }
      );
    }

    // 假设后端返回 accessToken 字段作为认证token
    // 注意：这里只写 accessToken，如有需要 id/refresh token 可扩展
    const response = NextResponse.json({ message: '登录成功' });
    if (data.accessToken) {
      response.cookies.set('token', data.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        // maxAge: 可定制
      });
    }
    // 其它 token（如 refreshToken）可在此处继续写入cookie
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: '登录接口服务异常' },
      { status: 502 }
    );
  }
}