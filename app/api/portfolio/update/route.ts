import { NextResponse } from 'next/server';
import { getPortfolioData, savePortfolioData } from '@/lib/data';
import { PortfolioData } from '@/types/portfolio';
import { sanitizeInput, validateJSONSize } from '@/lib/security';
import { cookies } from 'next/server';

export const dynamic = 'force-dynamic';

// 관리자 인증 확인
function isAuthenticated(request: Request): boolean {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return false;
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>);
    
    return cookies['admin_session'] === 'true';
}

export async function POST(request: Request) {
    try {
        // 인증 확인
        if (!isAuthenticated(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        // JSON 크기 검증
        if (!validateJSONSize(body, 500)) { // 500KB 제한
            return NextResponse.json(
                { error: 'Request payload too large' },
                { status: 413 }
            );
        }

        const { section, data } = body;

        if (!section || data === undefined || data === null) {
            return NextResponse.json({ error: 'Missing section or data' }, { status: 400 });
        }

        // Section 검증 (허용된 섹션만)
        const allowedSections = [
            'profile', 'heroButtons', 'experience', 'skills', 
            'certifications', 'blog', 'publications', 'socials', 'calendar'
        ];
        
        if (!allowedSections.includes(section)) {
            return NextResponse.json(
                { error: `Invalid section: ${section}` },
                { status: 400 }
            );
        }

        // 입력값 Sanitization
        const sanitizedData = sanitizeInput(data);

        // Read existing data
        const portfolioData = await getPortfolioData();

        if (!portfolioData) {
            return NextResponse.json({ error: 'Failed to read portfolio data' }, { status: 500 });
        }

        // Update specific section
        // We need to cast to any to allow dynamic property access with string key 'section'
        // or use a switch statement for type safety. Let's use strict checks for safety.

        if (section === 'profile') {
            portfolioData.profile = { ...portfolioData.profile, ...sanitizedData };
        } else if (section === 'heroButtons') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'heroButtons must be an array' }, { status: 400 });
            }
            portfolioData.heroButtons = sanitizedData;
        } else if (section === 'experience') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'experience must be an array' }, { status: 400 });
            }
            portfolioData.experience = sanitizedData;
        } else if (section === 'skills') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'skills must be an array' }, { status: 400 });
            }
            portfolioData.skills = sanitizedData;
        } else if (section === 'certifications') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'certifications must be an array' }, { status: 400 });
            }
            portfolioData.certifications = sanitizedData;
        } else if (section === 'blog') {
            portfolioData.blog = { ...portfolioData.blog, ...sanitizedData };
        } else if (section === 'publications') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'publications must be an array' }, { status: 400 });
            }
            console.log('[API] Updating publications:', JSON.stringify(sanitizedData, null, 2));
            portfolioData.publications = sanitizedData;
        } else if (section === 'socials') {
            if (!Array.isArray(sanitizedData)) {
                return NextResponse.json({ error: 'socials must be an array' }, { status: 400 });
            }
            portfolioData.socials = sanitizedData;
        } else if (section === 'calendar') {
            if (!portfolioData.calendar) {
                portfolioData.calendar = {};
            }
            portfolioData.calendar = { ...portfolioData.calendar, ...sanitizedData };
            console.log('[API] Calendar data being saved:', JSON.stringify(portfolioData.calendar, null, 2));
        }

        // Write back to file
        const success = await savePortfolioData(portfolioData);

        if (!success) {
            return NextResponse.json({ error: 'Failed to save portfolio data' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update data';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
