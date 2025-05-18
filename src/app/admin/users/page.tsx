'use client';

import { useState, useEffect } from 'react';

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

  const fetchUsers = async (token?: string) => {
    if (token) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      setError('API base URL is not configured.');
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    // 实际应用中，需要从 localStorage 或其他地方获取 accessToken
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('Not authenticated. Please login.');
      setIsLoading(false);
      setIsLoadingMore(false);
      // 可以考虑重定向到登录页
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.push('/auth/login');
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        targetPath: 'user/list', // Specify the target path for the GET proxy
        limit: '10', // Default limit, can be made dynamic
      });
      if (token) {
        queryParams.set('paginationToken', token);
      }
      
      const url = `/api/proxy-get?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // If the proxy-get itself needs authentication from the client
          // 'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data: ListUsersResponse = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Failed to fetch users';
        throw new Error(errorMessage);
      }

      if (token) {
        setUsers(prevUsers => [...prevUsers, ...data.users]);
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
  }, []);

  const getAttributeValue = (attributes: UserAttribute[], attributeName: string): string => {
    const attribute = attributes.find(attr => attr.Name === attributeName);
    return attribute ? attribute.Value : 'N/A';
  };

  return (
    <div style={{ margin: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>User Management</h1>
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
          style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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