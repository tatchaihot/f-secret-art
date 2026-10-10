import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin1234';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return NextResponse.json({
    authenticated: session?.value === 'authenticated_admin',
  });
}

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();

    if (passcode === ADMIN_PASSCODE) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'authenticated_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
