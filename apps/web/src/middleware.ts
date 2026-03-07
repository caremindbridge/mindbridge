import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Determine base response
  let response: NextResponse;

  if (pathname.startsWith('/dashboard') && !token) {
    response = NextResponse.redirect(new URL('/login', request.url));
  } else if ((pathname === '/' || pathname === '/login' || pathname === '/register') && token) {
    const role = request.cookies.get('role')?.value;
    const dest = role === 'therapist' ? '/dashboard/therapist' : '/dashboard';
    response = NextResponse.redirect(new URL(dest, request.url));
  } else {
    response = NextResponse.next();
  }

  // Auto-detect locale on first visit (if cookie not set)
  const localeCookie = request.cookies.get('locale')?.value;
  if (!localeCookie || !['en', 'ru'].includes(localeCookie)) {
    const acceptLang = request.headers.get('accept-language') || '';
    const detected = acceptLang.toLowerCase().includes('ru') ? 'ru' : 'en';
    response.cookies.set('locale', detected, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)', '/'],
};
