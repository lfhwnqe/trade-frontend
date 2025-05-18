import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get('targetPath');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    console.error('API base URL is not configured for GET proxy');
    return NextResponse.json({ message: 'API configuration error' }, { status: 500 });
  }

  if (!targetPath) {
    return NextResponse.json({ message: 'targetPath query parameter is required' }, { status: 400 });
  }

  // Remove targetPath from searchParams to avoid sending it to the backend
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.delete('targetPath');
  const queryString = newSearchParams.toString();
  
  const targetUrl = `${apiBaseUrl}${targetPath}${queryString ? `?${queryString}` : ''}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('next-url'); // Next.js specific header
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
    return NextResponse.json({ message }, { status: 502 }); // Bad Gateway
  }
}