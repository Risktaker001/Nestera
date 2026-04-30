import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const locales = ["en", "es"] as const;
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localeInPath = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (localeInPath) {
    const response = NextResponse.rewrite(
      new URL(
        pathname.replace(new RegExp(`^/${localeInPath}`), "") || "/",
        request.url,
      ),
    );

    response.cookies.set("nestera-locale", localeInPath);
    return response;
  }

  if (pathname === "/") {
    const response = NextResponse.redirect(
      new URL(`/${defaultLocale}`, request.url),
    );
    response.cookies.set("nestera-locale", defaultLocale);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)"],
};
