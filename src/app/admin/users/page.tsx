'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAtomImmer } from '@/hooks/useAtomImmer';
import {
  usersAtom,
  nextTokenAtom,
  isLoadingAtom,
  errorAtom,
  isLoadingMoreAtom,
  regOpenAtom,
  regChangingAtom,
  regOpErrorAtom,
  ListUsersResponse,
  UserAttribute,
} from './atom';



export default function AdminUserManagementPage() {
  const [users, updateUsers] = useAtomImmer(usersAtom);
  const [nextToken, updateNextToken] = useAtomImmer(nextTokenAtom);
  const [isLoading, updateIsLoading] = useAtomImmer(isLoadingAtom);
  const [error, updateError] = useAtomImmer(errorAtom);
  const [isLoadingMore, updateIsLoadingMore] = useAtomImmer(isLoadingMoreAtom);
  const router = useRouter();

  const fetchUsers = async (token?: string) => {
    if (token) {
      updateIsLoadingMore(true);
    } else {
      updateIsLoading(true);
    }
    updateError('');

    try {
      const proxyParams = {
        targetPath: 'user/list',
        actualMethod: 'GET',
      };
      const actualBody = {
        limit: 10,
        paginationToken: token,
      };

      const response = await fetchWithAuth(`/api/proxy-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        proxyParams: proxyParams,
        actualBody: actualBody,
      }, router);

      const data: ListUsersResponse = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : 'Failed to fetch users';
        throw new Error(errorMessage);
      }

      if (token) {
        updateUsers(draft => { draft.push(...data.users); });
      } else {
        updateUsers(data.users);
      }
      updateNextToken(data.nextToken);
    } catch (err) {
      if (err instanceof Error) {
        updateError(err.message);
      } else {
        updateError('An unexpected error occurred while fetching users.');
      }
    } finally {
      updateIsLoading(false);
      updateIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // 加载注册开关状态
    (async () => {
      try {
        const proxyParams = {
          targetPath: 'user/registration/status',
          actualMethod: 'GET',
        };
        const actualBody = {};
        const res = await fetchWithAuth(`/api/proxy-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          proxyParams: proxyParams,
          actualBody: actualBody,
        }, router);
        const data = await res.json();
        if (res.ok && typeof data.enable === 'boolean') {
          updateRegOpen(data.enable);
        }
      } catch {
        // 忽略错误，默认为开启
      }
    })();
  }, []);

  const getAttributeValue = (attributes: UserAttribute[], attributeName: string): string => {
    const attribute = attributes.find(attr => attr.Name === attributeName);
    return attribute ? attribute.Value : 'N/A';
  };

  // 注册开关控制
  const [regOpen, updateRegOpen] = useAtomImmer(regOpenAtom);
  const [regChanging, updateRegChanging] = useAtomImmer(regChangingAtom);
  const [regOpError, updateRegOpError] = useAtomImmer(regOpErrorAtom);
  // 初始假定为开启，如果后端有查询接口可扩展fetch注册状态

  const handleToggleRegistration = async (enable: boolean) => {
    updateRegChanging(true);
    updateRegOpError('');
    try {
      const proxyParams = {
        targetPath: 'user/registration/status',
        actualMethod: 'PATCH',
      };
      const actualBody = {
        enable,
      };
      const resp = await fetchWithAuth('/api/proxy-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        proxyParams: proxyParams,
        actualBody: actualBody,
      }, router);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || '操作失败');
      }
      updateRegOpen(enable);
    } catch (err) {
      if (err instanceof Error) updateRegOpError(err.message);
      else updateRegOpError('操作注册功能时发生未知错误');
    } finally {
      updateRegChanging(false);
    }
  };

  return (
    <div style={{ margin: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>User Management</h1>
      <div style={{ marginBottom: 12 }}>
        <b>注册功能：</b>
        <span style={{ color: regOpen === false ? 'red' : 'green' }}>
          {regOpen === false ? '已关闭' : '已开启'}
        </span>
        <button
          style={{
            marginLeft: 12,
            padding: '6px 14px',
            backgroundColor: regOpen === false ? '#0070f3' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          disabled={regChanging}
          onClick={() => handleToggleRegistration(!(regOpen !== false))}
        >
          {regOpen === false ? '开启注册' : '关闭注册'}
        </button>
        {regChanging && <span style={{ marginLeft: 8 }}>操作中...</span>}
        {regOpError && <span style={{ color: 'red', marginLeft: 8 }}>{regOpError}</span>}
      </div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {isLoading && <p>Loading users...</p>}

      {!isLoading && users.length === 0 && !error && <p>No users found.</p>}

      {users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>User ID (Username)</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Enabled</th>
              <th style={tableHeaderStyle}>Created At</th>
              <th style={tableHeaderStyle}>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} style={tableRowStyle}>
                <td style={tableCellStyle}>{user.userId}</td>
                <td style={tableCellStyle}>{getAttributeValue(user.attributes, 'email')}</td>
                <td style={tableCellStyle}>{user.userStatus}</td>
                <td style={tableCellStyle}>{user.enabled ? 'Yes' : 'No'}</td>
                <td style={tableCellStyle}>{new Date(user.createdAt).toLocaleString()}</td>
                <td style={tableCellStyle}>{new Date(user.lastModifiedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nextToken && !isLoadingMore && (
        <button
          onClick={() => fetchUsers(nextToken)}
          style={{
            marginTop: '20px',
            padding: '10px 15px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load More
        </button>
      )}
      {isLoadingMore && <p>Loading more users...</p>}
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  borderBottom: '2px solid #ddd',
  padding: '12px',
  textAlign: 'left',
  backgroundColor: '#f9f9f9',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #eee',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
};