/**
 * Lightweight, zero-dependency Supabase REST, Auth & Storage Client
 * Built on Node.js native fetch for black-box E2E testing.
 */

import { config } from '../config.js';

export function createApiClient(customOptions = {}) {
  const baseUrl = (customOptions.supabaseUrl || config.supabaseUrl).replace(/\/$/, '');
  const anonKey = customOptions.anonKey || config.supabaseAnonKey;
  let authToken = customOptions.authToken || null;

  function getHeaders(extraHeaders = {}) {
    const headers = {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  return {
    setAuthToken(token) {
      authToken = token;
    },

    getAuthToken() {
      return authToken;
    },

    // 1. Supabase Auth API
    auth: {
      async signInWithPassword({ email, password }) {
        const url = `${baseUrl}/auth/v1/token?grant_type=password`;
        const res = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => null);
        return {
          status: res.status,
          ok: res.ok,
          data: res.ok ? data : null,
          error: !res.ok ? data : null,
          accessToken: data?.access_token || null,
          user: data?.user || null
        };
      },

      async signUp({ email, password, data = {} }) {
        const url = `${baseUrl}/auth/v1/signup`;
        const res = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password, data })
        });
        const json = await res.json().catch(() => null);
        return {
          status: res.status,
          ok: res.ok,
          data: res.ok ? json : null,
          error: !res.ok ? json : null
        };
      },

      async getUser(token) {
        const tokenToUse = token || authToken;
        const url = `${baseUrl}/auth/v1/user`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${tokenToUse}`
          }
        });
        const json = await res.json().catch(() => null);
        return { status: res.status, ok: res.ok, user: json, error: !res.ok ? json : null };
      }
    },

    // 2. Supabase PostgREST Database API
    from(table) {
      return {
        async select(columns = '*', queryParams = {}) {
          const params = new URLSearchParams({ select: columns });
          for (const [key, val] of Object.entries(queryParams)) {
            params.set(key, val);
          }
          const url = `${baseUrl}/rest/v1/${table}?${params.toString()}`;
          const res = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
          });
          const data = await res.json().catch(() => null);
          return {
            status: res.status,
            ok: res.ok,
            data: res.ok ? data : null,
            error: !res.ok ? data : null
          };
        },

        async insert(payload, { returnRepresentation = true } = {}) {
          const url = `${baseUrl}/rest/v1/${table}`;
          const extraHeaders = {};
          if (returnRepresentation) {
            extraHeaders['Prefer'] = 'return=representation';
          }
          const res = await fetch(url, {
            method: 'POST',
            headers: getHeaders(extraHeaders),
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => null);
          return {
            status: res.status,
            ok: res.ok,
            data: res.ok ? data : null,
            error: !res.ok ? data : null
          };
        },

        async update(payload, queryParams = {}) {
          const params = new URLSearchParams(queryParams);
          const url = `${baseUrl}/rest/v1/${table}?${params.toString()}`;
          const res = await fetch(url, {
            method: 'PATCH',
            headers: getHeaders({ 'Prefer': 'return=representation' }),
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => null);
          return {
            status: res.status,
            ok: res.ok,
            data: res.ok ? data : null,
            error: !res.ok ? data : null
          };
        },

        async delete(queryParams = {}) {
          const params = new URLSearchParams(queryParams);
          const url = `${baseUrl}/rest/v1/${table}?${params.toString()}`;
          const res = await fetch(url, {
            method: 'DELETE',
            headers: getHeaders({ 'Prefer': 'return=representation' })
          });
          const data = await res.json().catch(() => null);
          return {
            status: res.status,
            ok: res.ok,
            data: res.ok ? data : null,
            error: !res.ok ? data : null
          };
        }
      };
    },

    // 3. Supabase Storage API
    storage: {
      from(bucket) {
        return {
          async upload(filePath, fileBuffer, { contentType = 'image/png', upsert = true } = {}) {
            const cleanPath = filePath.replace(/^\//, '');
            const url = `${baseUrl}/storage/v1/object/${bucket}/${cleanPath}`;
            const headers = {
              'apikey': anonKey,
              'Content-Type': contentType,
              'x-upsert': upsert ? 'true' : 'false'
            };
            if (authToken) {
              headers['Authorization'] = `Bearer ${authToken}`;
            }
            const res = await fetch(url, {
              method: 'POST',
              headers,
              body: fileBuffer
            });
            const data = await res.json().catch(() => null);
            return {
              status: res.status,
              ok: res.ok,
              data: res.ok ? data : null,
              error: !res.ok ? data : null
            };
          },

          getPublicUrl(filePath) {
            const cleanPath = filePath.replace(/^\//, '');
            return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
          },

          async downloadPublic(filePath) {
            const url = this.getPublicUrl(filePath);
            const res = await fetch(url);
            return {
              status: res.status,
              ok: res.ok,
              headers: res.headers,
              contentType: res.headers.get('content-type')
            };
          }
        };
      }
    }
  };
}

/**
 * Domain Validation & Normalization Helpers
 */
export function normalizeMatricNumber(raw) {
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  return raw.trim().toUpperCase();
}

export function validateMalaysianIC(ic) {
  if (!ic || typeof ic !== 'string') return false;
  const digits = ic.replace(/\D/g, '');
  return digits.length === 12;
}

export function maskIC(ic) {
  if (!ic) return '••••••-••-••••';
  const digits = ic.replace(/\D/g, '');
  if (digits.length === 12) {
    return `••••••-••-${digits.slice(8)}`;
  }
  return '••••••-••-••••';
}
