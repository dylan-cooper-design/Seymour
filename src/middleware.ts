import { type NextRequest, NextResponse } from "next/server";

export async function middleware(_request: NextRequest) {
  // Sign-in gate is disabled for demo purposes. Restore the Supabase
  // session check here to require login again.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     * Auth routes (/auth/*) are allowed through but still get session refresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
