import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 检查是否是文件上传请求
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    if (isFormData) {
      // 处理文件上传请求
      return handleFileUpload(request);
    } else {
      // 处理普通 JSON 请求
      return handleJsonRequest(request);
    }
  } catch (error) {
    console.error('Error in POST proxy:', error);
    let message = 'An error occurred while proxying the request.';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 502 });
  }
}

async function handleFileUpload(request: NextRequest) {
  const formData = await request.formData();

  // 从 formData 中提取代理参数
  const targetPath = formData.get('targetPath') as string;
  const actualMethod = formData.get('actualMethod') as string;

  if (!targetPath) {
    return NextResponse.json({ message: 'targetPath is required in form data' }, { status: 400 });
  }

  if (!actualMethod) {
    return NextResponse.json({ message: 'actualMethod is required in form data' }, { status: 400 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    console.error('API base URL is not configured for POST proxy');
    return NextResponse.json({ message: 'API configuration error' }, { status: 500 });
  }

  // 创建新的 FormData，只包含实际的文件和参数
  const backendFormData = new FormData();
  formData.forEach((value, key) => {
    if (key !== 'targetPath' && key !== 'actualMethod') {
      backendFormData.append(key, value);
    }
  });

  const targetUrl = `${apiBaseUrl}${targetPath}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('next-url');
  headers.delete('x-nextjs-data');
  headers.delete('x-invoke-path');
  headers.delete('x-invoke-query');
  headers.delete('content-length');
  // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data 边界

  const method = actualMethod.toUpperCase();
  const backendResponse = await fetch(targetUrl, {
    method: method,
    headers: headers,
    body: backendFormData,
  });

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
      responseHeaders.set(key, value);
    }
  });

  const responseBody = await backendResponse.text();

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

async function handleJsonRequest(request: NextRequest) {
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
    if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
      responseHeaders.set(key, value);
    }
  });

  const responseBody = await backendResponse.text();

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}