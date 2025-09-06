import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que NO requieren autenticación (más específico)
  const publicRoutes = ["/login"]
  const publicApiRoutes = ["/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/clear-cookies"]
  
  // Si es una ruta API pública, permitir acceso
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si hay sesión
  const sessionCookie = request.cookies.get("session")

  if (!sessionCookie) {
    // No hay sesión, redirigir a login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const session = JSON.parse(sessionCookie.value)

    // Verificar que la sesión tenga los datos necesarios
    if (!session.userId || !session.rol) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verificar rutas específicas por rol
    if (pathname.startsWith("/portal") && session.rol !== "CLIENTE") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (pathname === "/" && session.rol === "CLIENTE") {
      return NextResponse.redirect(new URL("/portal", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Error al parsear la sesión, redirigir a login
    console.error("Error parsing session:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|.*\\..*$).*)",
  ],
}
