import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 直接清除 token cookie
    const response = NextResponse.json({ message: '登出成功' });
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // 立即过期
    });
    
    return response;
  } catch (error) {
    console.error('登出接口服务异常:', error);
    return NextResponse.json(
      { message: '登出接口服务异常' },
      { status: 502 }
    );
  }
}
