import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        environment: process.env.NODE_ENV,
        variables: {
            GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ? 'Present (Starts with ' + process.env.GOOGLE_REFRESH_TOKEN.substring(0, 5) + '...)' : 'Missing',
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing',
            GOOGLE_CALENDAR_API_KEY: process.env.GOOGLE_CALENDAR_API_KEY ? 'Present' : 'Missing',
            GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID ? 'Present' : 'Missing',
        },
        timestamp: new Date().toISOString()
    });
}
