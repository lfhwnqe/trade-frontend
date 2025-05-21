import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 从 searchParams 中提取代理参数
  const targetPath = searchParams.get('targetPath');

  // 提取实际的请求参数，并将其转换为对象
  const actualParams: { [key: string]: string | null } = {};
  searchParams.forEach((value, key) => {
    if (key !== 'targetPath') {
      actualParams[key] = value;
    }
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    console.error('API base URL is not configured for GET proxy');
    return NextResponse.json({ message: 'API configuration error' }, { status: 500 });
  }

  if (!targetPath) {
    return NextResponse.json({ message: 'targetPath query parameter is required' }, { status: 400 });
  }

  // 将 actualParams 转换为 Record<string, string> 类型，并过滤掉 null 值
  const filteredActualParams: Record<string, string> = Object.fromEntries(
    Object.entries(actualParams)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, value!])
  );

  // 构建实际请求的查询字符串
  const actualQueryString = new URLSearchParams(filteredActualParams).toString();

  const targetUrl = `${apiBaseUrl}${targetPath}${actualQueryString ? `?${actualQueryString}` : ''}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('next-url');
  headers.delete('x-nextjs-data');
  headers.delete('x-invoke-path');
  headers.delete('x-invoke-query');

  try {
    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error proxying GET to ${targetUrl}:`, error);
    let message = 'An error occurred while proxying the GET request.';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 502 });
  }
}