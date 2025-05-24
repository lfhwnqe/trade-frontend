'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      // setError('API base URL is not configured.'); // No longer needed as we call internal API
      // setIsLoading(false);
      // return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // 登录成功后跳转回之前想访问的页面（如果有），否则首页
      if (typeof window !== 'undefined') {
        const redirectPath = window.localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          window.localStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
          return;
        }
      }
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        Don&apos;t have an account? <a href="/auth/register" style={{ color: '#0070f3' }}>Register here</a>
      </p>
    </div>
  );
}