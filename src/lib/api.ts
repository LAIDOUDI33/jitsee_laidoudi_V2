/**
 * Client-side API utility for authenticated fetch requests.
 * Reads the JWT token from localStorage and attaches it as a Bearer token.
 */

/**
 * Get the stored access token from localStorage.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('alvision_access_token');
}

/**
 * Get the stored refresh token from localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('alvision_refresh_token');
}

/**
 * Create authenticated headers for API requests.
 * Only use this on the client side.
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Clear stored auth tokens (on logout).
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('alvision_access_token');
  localStorage.removeItem('alvision_refresh_token');
}

/**
 * Authenticated fetch wrapper.
 * Automatically attaches Bearer token and handles token refresh on 401.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !options.body?.toString().startsWith('FormData')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  // If 401 and we have a refresh token, try to refresh
  // Skip refresh if the server reports TOKEN_REVOKED — clear tokens immediately
  if (response.status === 401) {
    // Try to read the error body to check for TOKEN_REVOKED
    let isRevoked = false;
    try {
      const errorBody = await response.clone().json();
      if (errorBody?.error?.code === 'TOKEN_REVOKED') {
        isRevoked = true;
      }
    } catch {
      // Response body not JSON — proceed with normal refresh flow
    }

    if (isRevoked) {
      clearAuthTokens();
    } else {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.data?.accessToken) {
              localStorage.setItem('alvision_access_token', refreshData.data.accessToken);
              // Retry original request with new token
              headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
              return fetch(url, { ...options, headers });
            }
          }
        } catch {
          // Refresh failed — clear tokens and let the caller handle it
          clearAuthTokens();
        }
      }
    }
  }

  return response;
}
