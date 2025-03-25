import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Permitir requisições para a API de Memory Games
  if (request.nextUrl.pathname.startsWith('/api/memory-games')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
}; 