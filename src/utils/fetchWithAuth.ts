import { useRouter } from 'next/navigation';

interface ProxyParams {
  targetPath: string;
  actualMethod: string;
}

interface Init extends RequestInit {
  proxyParams?: ProxyParams;
  actualBody?: Record<string, unknown>;
}

/**
 * 用于在 react 组件内统一处理登录态过期的 fetch 封装
 * @param input fetch url
 * @param init fetch init
 * @param router 可选 next/router 实例（因 useRouter 只能在组件用）
 * @returns fetch 返回的 response
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: Init,
  router?: ReturnType<typeof useRouter>,
): Promise<Response> {
  // 如果 init 中有 proxyParams 和 actualBody，则修改 body
  if (init?.proxyParams && init?.actualBody) {
    init.body = JSON.stringify({
      request: init.proxyParams,
      body: init.actualBody,
    });
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    };
  }

  const resp = await fetch(input, init);

  if (resp.status === 401) {
    // 前端收到 401，自动跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    } else if (router) {
      router.push('/auth/login');
    }
    // 可抛异常终止业务
    throw new Error('未认证或登录已过期，请重新登录');
  }

  return resp;
}