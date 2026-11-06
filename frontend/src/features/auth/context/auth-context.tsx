"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { httpClient } from "@/lib/http/client";
import { parseJwtPayload } from "@/lib/utils/cookies";
import { signOutFirebase } from "@/lib/firebase/client";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "KITCHEN" | "CUSTOMER" | string;
  full_name?: string | null;
  phone?: string | null;
  status?: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSession: (accessToken: string, refreshToken?: string, user?: AuthUser, rememberMe?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      const refreshToken = httpClient.getRefreshToken();
      if (refreshToken) {
        await httpClient.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      await signOutFirebase().catch(() => {});
      httpClient.clearTokens();
      setUser(null);
      setToken(null);
      window.location.href = "/dang-nhap";
    }
  }, []);

  const setSession = useCallback(
    (accessToken: string, refreshToken?: string, newUser?: AuthUser, rememberMe: boolean = true) => {
      httpClient.setTokens(accessToken, refreshToken, newUser, rememberMe);
      setToken(accessToken);
      if (newUser) {
        setUser(newUser);
      } else {
        const payload = parseJwtPayload(accessToken);
        if (payload) {
          setUser({
            id: payload.sub || payload.id,
            email: payload.email,
            role: payload.role,
            status: payload.status,
          });
        }
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") return;

    let currentToken = httpClient.getToken();
    const currentRefreshToken = httpClient.getRefreshToken();

    // 1. Không có cả access token lẫn refresh token -> coi như chưa đăng nhập
    if (!currentToken && !currentRefreshToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // 2. Thử đọc user đã cache để UI hiển thị tức thì, không bị nháy màn hình
    const cachedUser = httpClient.getUser();
    if (cachedUser) {
      setUser(cachedUser);
    } else if (currentToken) {
      const payload = parseJwtPayload(currentToken);
      if (payload) {
        setUser({
          id: payload.sub || payload.id,
          email: payload.email,
          role: payload.role,
          status: payload.status,
        });
      }
    }

    // 3. Kiểm tra xem Access Token có bị hết hạn hay chưa
    let isExpired = true;
    if (currentToken) {
      const payload = parseJwtPayload(currentToken);
      if (payload?.exp) {
        // Trừ hao 30 giây để tránh chênh lệch thời gian clock skew
        isExpired = payload.exp * 1000 - 30000 < Date.now();
      }
    }

    // 4. Nếu access token hết hạn nhưng còn refresh token -> tự động làm mới trong nền
    if (isExpired && currentRefreshToken) {
      try {
        const newAccess = await httpClient.refreshTokens();
        if (newAccess) {
          currentToken = newAccess;
          setToken(newAccess);
        } else {
          // Refresh thất bại (token bị thu hồi hoặc hết hạn vĩnh viễn)
          await logout();
          return;
        }
      } catch {
        await logout();
        return;
      }
    } else if (currentToken) {
      setToken(currentToken);
    }

    // 5. Đồng bộ thông tin mới nhất từ máy chủ qua /auth/me
    try {
      const me: any = await httpClient.get("/auth/me");
      if (me && me.id) {
        const fullUser: AuthUser = {
          id: me.id ? me.id.toString() : "",
          email: me.email,
          role: me.role,
          full_name: me.full_name || me.email?.split("@")[0],
          phone: me.phone,
          status: me.status,
          avatar_url: me.avatar_url,
        };
        setUser(fullUser);
        localStorage.setItem("viviet_user", JSON.stringify(fullUser));
      }
    } catch (err: any) {
      // Nếu 401 Unauthorized và refresh token không cứu được
      if (err.statusCode === 401 || err.status === 401) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        logout,
        refreshUser,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

