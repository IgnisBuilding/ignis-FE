import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // Authentication is handled client-side via AuthContext
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude static files, images, and API paths from middleware
    '/((?!_next/static|_next/image|favicon.ico|fireSafety|api|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
};
