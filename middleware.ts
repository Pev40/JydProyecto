import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas que NO requieren autenticación
  const publicRoutes = ["/login", "/portal"]
  
  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Si es una ruta de API, permitir acceso (la autenticación se maneja en cada endpoint)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }
  
  // Si es archivo estático, permitir acceso
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next()
  }

  // Para todas las demás rutas, verificar sesión
  const sessionCookie = request.cookies.get("session")
  
  if (!sessionCookie) {
    // Solo redirigir si no estamos ya en login
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    if (!session.userId) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si hay sesión válida, permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
}