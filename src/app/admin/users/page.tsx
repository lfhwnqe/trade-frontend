'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface UserAttribute {
  Name: string;
  Value: string;
}

interface User {
  userId: string;
  attributes: UserAttribute[];
  enabled: boolean;
  userStatus: string;
  createdAt: string;
  lastModifiedAt: string;
}

interface ListUsersResponse {
  users: User[];
  nextToken?: string;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  const fetchUsers = async (token?: string) => {
    if (token) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('targetPath', 'user/list');
      params.append('limit', '10');
      if (token) params.append('paginationToken', token);

      const response = await fetchWithAuth(`/api/proxy-get?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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
        setUsers((prevUsers) => [...prevUsers, ...data.users]);
      } else {
        setUsers(data.users);
      }
      setNextToken(data.nextToken);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching users.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // 加载注册开关状态
    (async () => {
      try {
        const params = new URLSearchParams();
        params.append('targetPath', 'user/registration/status');
        const res = await fetchWithAuth(`/api/proxy-get?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }, router);
        const data = await res.json();
        if (res.ok && typeof data.enable === 'boolean') {
          setRegOpen(data.enable);
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
  const [regOpen, setRegOpen] = useState<boolean | null>(null);
  const [regChanging, setRegChanging] = useState(false);
  const [regOpError, setRegOpError] = useState('');
  // 初始假定为开启，如果后端有查询接口可扩展fetch注册状态

  const handleToggleRegistration = async (enable: boolean) => {
    setRegChanging(true);
    setRegOpError('');
    try {
      const resp = await fetchWithAuth('/api/proxy-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath: 'user/registration/status',
          actualMethod: 'PATCH',
          enable,
        }),
      }, router);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || '操作失败');
      }
      setRegOpen(enable);
    } catch (err) {
      if (err instanceof Error) setRegOpError(err.message);
      else setRegOpError('操作注册功能时发生未知错误');
    } finally {
      setRegChanging(false);
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