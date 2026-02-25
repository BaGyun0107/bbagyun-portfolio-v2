import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, importJWK, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

/**
 * JWT_SECRET 문자열을 jose가 이해하는 CryptoKey 형태로 변환합니다.
 */
async function getSecretKey() {
  // TextEncoder로 바이트 배열로 변환 후 사용
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * accessToken 쿠키를 Edge Runtime에서 검증합니다.
 * @param token - JWT accessToken 문자열
 * @returns 검증 성공 시 페이로드, 실패 시 null
 */
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = await getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Next.js Edge Middleware
 * /admin/** 경로에 대한 모든 요청에서 accessToken 쿠키를 검증합니다.
 * 토큰이 없거나 유효하지 않으면 /login 으로 리다이렉트합니다.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/** 경로만 인터셉트
  if (pathname.startsWith("/admin")) {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      // accessToken 없음 → 로그인 페이지로 리다이렉트
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(accessToken);

    if (!payload) {
      // 토큰 검증 실패(만료 또는 변조) → refreshToken으로 갱신 시도
      const refreshToken = req.cookies.get("refreshToken")?.value;

      if (!refreshToken) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // refreshToken이 있으면 내부 refresh API로 갱신 시도
      try {
        const origin = req.nextUrl.origin;
        const refreshRes = await fetch(`${origin}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": `refreshToken=${refreshToken}`,
          },
          body: JSON.stringify({ token: refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }

        const refreshData = await refreshRes.json();
        const newAccessToken: string = refreshData.data?.accessToken;
        const newRefreshToken: string = refreshData.data?.refreshToken;
        const newCsrfToken: string = crypto.randomUUID();

        if (!newAccessToken) {
          throw new Error("No new access token from refresh");
        }

        const isProd = process.env.NODE_ENV === "production";
        const response = NextResponse.next();

        // 새 쿠키를 응답에 첨부
        response.cookies.set("accessToken", newAccessToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 10,
        });

        if (newRefreshToken) {
          response.cookies.set("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            path: "/api/v1/auth",
            maxAge: 60 * 60 * 24 * 7,
          });
        }

        response.cookies.set("csrfToken", newCsrfToken, {
          httpOnly: false,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 10,
        });

        return response;
      } catch {
        // 갱신 실패 → 로그인 페이지로 리다이렉트
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // 토큰 검증 성공 → 요청 통과
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
