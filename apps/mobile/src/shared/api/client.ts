import * as SecureStore from 'expo-secure-store';

import { siteConfig } from '../lib/site-config';

const API_URL = siteConfig.apiUrl;

class ApiClient {
  private async getHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('accessToken');
    return {
      'Content-Type': 'application/json',
      'X-Locale': siteConfig.locale,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_URL}${path}`, { method: 'GET', headers });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers });
    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      throw { status: 401, message: 'Unauthorized' };
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Network error' }));
      throw { status: res.status, ...error };
    }
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}

export const apiClient = new ApiClient();
