import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface JwtPayload {
  sub?: string;
  id?: string;
  email: string;
  role: string;
  status: string;
  exp?: number;
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function parseUserCookie(cookieValue?: string): any | null {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get("viviet_token")?.value;
  const refreshTokenCookie = request.cookies.get("viviet_refresh_token")?.value;
  const userCookie = request.cookies.get("viviet_user")?.value;

  const payload = tokenCookie ? parseJwt(tokenCookie) : null;
  const cachedUser = parseUserCookie(userCookie);

  // Xác định role từ payload JWT hoặc từ cookie user lưu kèm
  const role = payload?.role || cachedUser?.role;

  // Kiểm tra thời hạn Access Token (trừ hao 30 giây)
  const isTokenExpired = payload?.exp ? payload.exp * 1000 - 30000 < Date.now() : true;

  // Phiên đăng nhập hợp lệ: Access token còn hạn HOẶC có Refresh Token còn hiệu lực
  const hasValidSession = (Boolean(payload) && !isTokenExpired) || Boolean(refreshTokenCookie);

  // 1. Bảo vệ các trang ADMIN (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!hasValidSession) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role && role !== "ADMIN") {
      const forbiddenUrl = new URL("/403", request.url);
      forbiddenUrl.searchParams.set("reason", "admin_required");
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. Bảo vệ các trang STAFF & KITCHEN (/staff/*)
  if (pathname.startsWith("/staff")) {
    if (!hasValidSession) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const allowedStaffRoles = ["ADMIN", "OPERATOR", "KITCHEN"];
    if (role && !allowedStaffRoles.includes(role)) {
      const forbiddenUrl = new URL("/403", request.url);
      forbiddenUrl.searchParams.set("reason", "staff_required");
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 3. Bảo vệ các trang TÀI KHOẢN KHÁCH HÀNG (/tai-khoan/*)
  if (pathname.startsWith("/tai-khoan")) {
    if (!hasValidSession) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Nếu đã có phiên đăng nhập mà truy cập trang đăng nhập/đăng ký -> tự chuyển về workspace tương ứng
  if (pathname === "/dang-nhap" || pathname === "/dang-ky") {
    if (hasValidSession) {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "OPERATOR") {
        return NextResponse.redirect(new URL("/staff/orders", request.url));
      }
      if (role === "KITCHEN") {
        return NextResponse.redirect(new URL("/staff/kitchen", request.url));
      }
      return NextResponse.redirect(new URL("/tai-khoan", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/tai-khoan/:path*",
    "/dang-nhap",
    "/dang-ky",
  ],
};

