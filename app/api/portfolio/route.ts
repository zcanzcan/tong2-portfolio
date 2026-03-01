import { NextResponse } from 'next/server';
import { getPortfolioData, savePortfolioData } from '@/lib/data';

export const revalidate = 60; // Cache for 60 seconds (ISR)

export async function GET() {
    const data = await getPortfolioData();
    if (!data) {
        return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }
    return NextResponse.json(data);
}

// POST method removed to prevent accidental full-file overwrites.
// Use /api/portfolio/update for partial updates or specific section APIs.
