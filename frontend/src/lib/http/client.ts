import { env } from "@/lib/config/env";
import { ApiError } from "./errors";
import { setCookie, getCookie, deleteCookie } from "@/lib/utils/cookies";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  _retry?: boolean;
  responseType?: "json" | "blob";
}

class HttpClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getBaseUrl(): string {
    if (
      typeof window !== "undefined" &&
      window.location.hostname &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      try {
        const u = new URL(this.baseUrl);
        if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
          u.hostname = window.location.hostname;
          return u.toString().replace(/\/$/, "");
        }
      } catch {}
    }
    return this.baseUrl;
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("viviet_token") || getCookie("viviet_token");
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("viviet_refresh_token") || getCookie("viviet_refresh_token");
  }

  getUser(): any | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("viviet_user") || getCookie("viviet_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setTokens(accessToken: string, refreshToken?: string, user?: any, rememberMe: boolean = true) {
    if (typeof window === "undefined") return;
    const days = rememberMe ? 30 : 1;

    localStorage.setItem("viviet_token", accessToken);
    setCookie("viviet_token", accessToken, days);

    if (refreshToken) {
      localStorage.setItem("viviet_refresh_token", refreshToken);
      setCookie("viviet_refresh_token", refreshToken, days);
    }

    if (user) {
      const userStr = JSON.stringify(user);
      localStorage.setItem("viviet_user", userStr);
      setCookie("viviet_user", userStr, days);
    }
  }

  // Giữ tương thích ngược với các lời gọi cũ
  setToken(token: string, user?: any) {
    this.setTokens(token, undefined, user, true);
  }

  clearToken() {
    this.clearTokens();
  }

  clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("viviet_token");
    localStorage.removeItem("viviet_refresh_token");
    localStorage.removeItem("viviet_user");
    deleteCookie("viviet_token");
    deleteCookie("viviet_refresh_token");
    deleteCookie("viviet_user");
  }

  /**
   * Tự động làm mới access token bằng refresh token trong nền (Silent Refresh Rotation)
   */
  async refreshTokens(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const currentRefreshToken = this.getRefreshToken();
      if (!currentRefreshToken) {
        this.clearTokens();
        return null;
      }

      try {
        const response = await fetch(`${this.getBaseUrl()}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "ViVietWeb",
          },
          body: JSON.stringify({ refresh_token: currentRefreshToken }),
        });

        if (!response.ok) {
          throw new Error("Refresh token expired or invalid");
        }

        const data = await response.json();
        const payload = data?.data || data;

        if (payload?.access_token) {
          const newAccess = payload.access_token;
          const newRefresh = payload.refresh_token || currentRefreshToken;
          const user = payload.user || this.getUser();

          this.setTokens(newAccess, newRefresh, user, true);
          return newAccess;
        }

        this.clearTokens();
        return null;
      } catch (err) {
        console.warn("Auto-refresh session failed:", err);
        this.clearTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.getBaseUrl()}${cleanPath}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      headers: customHeaders,
      _retry = false,
      responseType = "json",
      ...restOptions
    } = options;
    const url = this.buildUrl(path, params);

    const token = this.getToken();
    const headers: Record<string, string> = {
      "X-Requested-With": "ViVietWeb",
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (!(restOptions.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
      });

      // Xử lý 401 Unauthorized: Thử tự động refresh token nếu chưa từng retry
      if (
        response.status === 401 &&
        !_retry &&
        !path.includes("/auth/login") &&
        !path.includes("/auth/refresh") &&
        !path.includes("/auth/register")
      ) {
        const newAccessToken = await this.refreshTokens();
        if (newAccessToken) {
          // Retry lại request ban đầu với token mới
          return this.request<T>(path, {
            ...options,
            _retry: true,
            headers: {
              ...customHeaders,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        }
      }

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = responseType === "blob"
        ? await response.blob()
        : isJson
          ? await response.json()
          : await response.text();

      if (!response.ok) {
        let errorMsg = "Yêu cầu thất bại";
        let errorCode: string | undefined;

        if (typeof data === "object" && data !== null) {
          if (Array.isArray((data as any).message)) {
            errorMsg = (data as any).message.join(", ");
          } else if (typeof (data as any).message === "string") {
            errorMsg = (data as any).message;
          }
          errorCode = (data as any).code || (data as any).error;
        }

        throw new ApiError(errorMsg, response.status, errorCode, data);
      }

      if (typeof data === "object" && data !== null && "data" in data && "success" in data) {
        return (data as any).data as T;
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError((err as Error).message || "Không thể kết nối tới máy chủ", 500);
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  download(path: string): Promise<Blob> {
    return this.request<Blob>(path, { method: "GET", responseType: "blob" });
  }
}

export const httpClient = new HttpClient(env.apiUrl);
