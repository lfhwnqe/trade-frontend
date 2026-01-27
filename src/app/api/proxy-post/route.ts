import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

    // 区分代理参数和实际请求参数
    const { request: proxyParams, body: actualBody } = requestBody;
    const { targetPath, actualMethod } = proxyParams;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
      console.error('API base URL is not configured for POST proxy');
      return NextResponse.json({ message: 'API configuration error' }, { status: 500 });
    }

    if (!targetPath) {
      return NextResponse.json({ message: 'targetPath is required in the request body' }, { status: 400 });
    }

    if (!actualMethod) {
      return NextResponse.json({ message: 'actualMethod is required in the request body' }, { status: 400 });
    }

    const targetUrl = `${apiBaseUrl}${targetPath}${request.nextUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('next-url');
    headers.delete('x-nextjs-data');
    headers.delete('x-invoke-path');
    headers.delete('x-invoke-query');
    headers.set('Content-Type', 'application/json');
    headers.delete('content-length');

    const method = actualMethod.toUpperCase();
    const backendResponse = await fetch(targetUrl, {
      method: method,
      headers: headers,
      body: (method === 'GET' || method === 'HEAD') ? undefined : JSON.stringify(actualBody),
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'connection' &&
        lowerKey !== 'set-cookie'
      ) {
        responseHeaders.set(key, value);
      }
    });

    // 透传后端下发的 Set-Cookie（例如 access token 自动刷新）
    const setCookies = backendResponse.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', cookie);
    }

    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error in POST proxy:', error);
    let message = 'An error occurred while proxying the request.';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 502 });
  }
}
