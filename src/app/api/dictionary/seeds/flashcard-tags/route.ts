import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
      return NextResponse.json({ message: 'API configuration error' }, { status: 500 });
    }

    const targetUrl = `${apiBaseUrl}dictionary/seeds/flashcard-tags`;
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('next-url');
    headers.delete('x-nextjs-data');
    headers.delete('x-invoke-path');
    headers.delete('x-invoke-query');
    headers.delete('content-length');

    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
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
    console.error('Error seeding flashcard tags via frontend proxy:', error);
    const message = error instanceof Error ? error.message : 'Failed to proxy flashcard tag seed request';
    return NextResponse.json({ message }, { status: 502 });
  }
}
