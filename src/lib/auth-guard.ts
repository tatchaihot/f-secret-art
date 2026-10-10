import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return session?.value === 'authenticated_admin';
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: จำเป็นต้องเข้าสู่ระบบแอดมินก่อนดำเนินการ' },
    { status: 401 }
  );
}
