import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSCODE = (process.env.ADMIN_PASSCODE || 'admin1234').trim();

function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https';
  }
  return req.url.startsWith('https://');
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return NextResponse.json({
    authenticated: session?.value === 'authenticated_admin',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const passcode = typeof body?.passcode === 'string' ? body.passcode.trim() : '';

    if (passcode && passcode === ADMIN_PASSCODE) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated_admin', {
        httpOnly: true,
        secure: isHttpsRequest(req),
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'รหัสผ่านแอดมินไม่ถูกต้อง' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
