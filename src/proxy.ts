import { NextResponse, type NextRequest } from "next/server";

// Garde des espaces réservés (middleware Next 16). L'agent d'accueil n'a accès qu'au
// contrôle des entrées ; le tableau de bord est réservé à l'organisateur.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/verification", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/verification/:path*"],
};
