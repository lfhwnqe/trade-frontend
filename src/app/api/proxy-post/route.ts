import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { targetPath, actualMethod, ...actualBody } = requestBody;

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

    // Preserve original search parameters if any, though less common for POST-like proxies
    const targetUrl = `${apiBaseUrl}${targetPath}${request.nextUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('next-url');
    headers.delete('x-nextjs-data');
    headers.delete('x-invoke-path');
    headers.delete('x-invoke-query');
    // Ensure content-type is set correctly if the body is JSON
    headers.set('Content-Type', 'application/json');
    // Remove original Content-Length to let fetch recalculate it based on the new body
    headers.delete('content-length');


    const backendResponse = await fetch(targetUrl, {
      method: actualMethod.toUpperCase(), // Use the method specified in the body
      headers: headers,
      body: JSON.stringify(actualBody), // Send the rest of the body
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
        responseHeaders.set(key, value);
      }
    });
    
    const responseBody = await backendResponse.text(); // Read body once to avoid issues

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
    return NextResponse.json({ message }, { status: 502 }); // Bad Gateway
  }
}