import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!session;
  const rol = session?.user?.rol;

  // Proteger /admin — solo rol admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || rol !== "admin") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  // Proteger /oficial — solo rol oficial
  if (pathname.startsWith("/oficial")) {
    if (!isLoggedIn || rol !== "oficial") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  // Login — si ya tiene sesión, redirigir al panel
  if (pathname.startsWith("/login") && isLoggedIn) {
    const destino = rol === "admin" ? "/admin" : "/oficial";
    return NextResponse.redirect(new URL(destino, req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/oficial/:path*", "/login"],
};
