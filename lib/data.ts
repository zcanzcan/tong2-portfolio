import { PortfolioData } from '@/types/portfolio';
import { getServiceSupabase } from './supabase-client';

export async function getPortfolioData(): Promise<PortfolioData | null> {
    try {
        const supabase = getServiceSupabase();
        
        // 여러 테이블을 병렬로 조회
        const [
            { data: profile },
            { data: heroButtons },
            { data: experiences },
            { data: publications },
            { data: showcaseProjects },
            { data: socialLinks },
            { data: blogInfo }
        ] = await Promise.all([
            supabase.from('profile').select('*').single(),
            supabase.from('hero_buttons').select('*').order('sort_order', { ascending: true }),
            supabase.from('experiences').select('*').order('sort_order', { ascending: true }),
            supabase.from('publications').select('*').order('sort_order', { ascending: true }),
            supabase.from('projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('social_links').select('*').order('sort_order', { ascending: true }),
            supabase.from('blog_info').select('*').single()
        ]);

        const portfolioData: any = {
            profile: profile || {},
            heroButtons: heroButtons || [],
            experience: experiences || [],
            publications: publications || [],
            projects: showcaseProjects || [],
            socials: socialLinks || [],
            blog: blogInfo || {},
            skills: [], // 스키마에 없으므로 빈 배열
            certifications: [], // 스키마에 없으므로 빈 배열
            calendar: {}
        };

        // Environment Variables Override (for Calendar)
        if (process.env.GOOGLE_REFRESH_TOKEN) portfolioData.calendar.refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        if (process.env.GOOGLE_CLIENT_ID) portfolioData.calendar.oauthClientId = process.env.GOOGLE_CLIENT_ID;
        if (process.env.GOOGLE_CLIENT_SECRET) portfolioData.calendar.oauthClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (process.env.GOOGLE_CALENDAR_API_KEY) portfolioData.calendar.apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
        if (process.env.GOOGLE_CALENDAR_ID) portfolioData.calendar.calendarId = process.env.GOOGLE_CALENDAR_ID;

        if (portfolioData.calendar.refreshToken && (!portfolioData.calendar.accessToken || portfolioData.calendar.accessToken === '')) {
            portfolioData.calendar.accessToken = 'managed_by_server';
        }

        return portfolioData as PortfolioData;
    } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        return null;
    }
}

export async function savePortfolioData(data: PortfolioData): Promise<boolean> {
    // Note: Full save is discouraged for Supabase. 
    // Individual sections should use specific update logic.
    // This is kept for compatibility but should be replaced by partial updates.
    console.warn('Full savePortfolioData called. This might be inefficient for Supabase.');
    return false;
}
