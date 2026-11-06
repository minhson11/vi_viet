import { env } from "@/lib/config/env";
import { ApiError } from "./errors";

interface ServerRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string;
}

export async function serverFetch<T>(path: string, options: ServerRequestOptions = {}): Promise<T> {
  const { params, token, headers: customHeaders, ...restOptions } = options;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${env.apiUrl}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "ViVietWeb",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMsg = "Yêu cầu từ server thất bại";
    if (typeof data === "object" && data !== null && (data as any).message) {
      errorMsg = Array.isArray((data as any).message)
        ? (data as any).message.join(", ")
        : (data as any).message;
    }
    throw new ApiError(errorMsg, response.status, undefined, data);
  }

  if (typeof data === "object" && data !== null && "data" in data && "success" in data) {
    return (data as any).data as T;
  }

  return data as T;
}

