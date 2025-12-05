import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, password } = body;

        // Credentials from environment variables
        const ADMIN_ID = process.env.ADMIN_ID;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_ID || !ADMIN_PASSWORD) {
            console.error('Admin credentials not configured in environment variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
            // Set a cookie for the session
            const cookieStore = await cookies();
            cookieStore.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 // 1 day
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: '관리자가 아닙니다' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
