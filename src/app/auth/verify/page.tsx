'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 页面加载自动填充用户名
  useEffect(() => {
    const uname = searchParams.get('username');
    if (uname) setUsername(uname);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!username || !code) {
      setError('用户名和验证码均不能为空');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/proxy-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetPath: 'user/confirm',
          actualMethod: 'POST',
          username,
          code
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '验证码确认失败');
      }

      setMessage(data.message || '账号已成功验证，现在可以登录。');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('验证码确认发生未知错误');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>注册账号激活</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>用户名：</label>
          <input
            id="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={64}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="code" style={{ display: 'block', marginBottom: '5px' }}>验证码：</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            minLength={4}
            maxLength={10}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            autoComplete="one-time-code"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? '验证中...' : '确认'}
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        未收到验证码？请检查邮箱垃圾箱或
        <a href="/auth/register" style={{ color: '#0070f3', marginLeft: '5px' }}>重新注册</a>
      </p>
    </div>
  );
}