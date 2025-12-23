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
            { data: projects },
            { data: socialLinks },
            { data: blogInfo },
            { data: skills },
            { data: certifications }
        ] = await Promise.all([
            supabase.from('profile').select('*').limit(1).maybeSingle(),
            supabase.from('hero_buttons').select('*').order('sort_order', { ascending: true }),
            supabase.from('experiences').select('*').order('sort_order', { ascending: true }),
            supabase.from('publications').select('*').order('sort_order', { ascending: true }),
            supabase.from('projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('social_links').select('*').order('sort_order', { ascending: true }),
            supabase.from('blog_info').select('*').limit(1).maybeSingle(),
            supabase.from('skills').select('*').order('sort_order', { ascending: true }),
            supabase.from('certifications').select('*').order('sort_order', { ascending: true })
        ]);

        const portfolioData: any = {
            profile: profile ? {
                name: profile.name,
                nameEn: profile.name_en,
                title: profile.title,
                titleEn: profile.title_en,
                bio: profile.bio,
                bioEn: profile.bio_en,
                status: profile.status,
                statusEn: profile.status_en,
                image: profile.image
            } : {},
            heroButtons: (heroButtons || []).map(b => ({
                text: b.text,
                textEn: b.text_en,
                icon: b.icon,
                url: b.url,
                variant: b.variant,
                dropdownItems: b.dropdown_items
            })),
            experience: (experiences || []).map(e => ({
                id: e.id,
                role: e.role,
                roleEn: e.role_en,
                company: e.company,
                companyEn: e.company_en,
                period: e.period,
                periodEn: e.period_en,
                color: e.color
            })),
            publications: (publications || []).map(p => ({
                id: p.id,
                tag: p.tag,
                tagEn: p.tag_en,
                title: p.title,
                titleEn: p.title_en,
                description: p.description,
                descriptionEn: p.description_en,
                image: p.image,
                link: p.link,
                purchaseLinks: p.purchase_links
            })),
            projects: (projects || []).map(p => ({
                id: p.id,
                title: p.title,
                titleEn: p.title_en,
                description: p.description,
                descriptionEn: p.description_en,
                link: p.link,
                tags: p.tags,
                image: p.image
            })),
            socials: (socialLinks || []).map(s => ({
                id: s.id,
                name: s.name,
                icon: s.icon,
                url: s.url,
                color: s.color
            })),
            blog: blogInfo ? {
                title: blogInfo.title,
                description: blogInfo.description,
                url: blogInfo.url
            } : {},
            skills: (skills || []).map(s => ({
                name: s.name,
                icon: s.icon,
                color: s.color
            })),
            certifications: (certifications || []).map(c => ({
                id: c.id,
                name: c.name,
                nameEn: c.name_en,
                issuer: c.issuer,
                issuerEn: c.issuer_en,
                date: c.date,
                url: c.url
            })),
            calendar: {
                calendarId: process.env.GOOGLE_CALENDAR_ID || '1fda3a586c34793850a168648de641a6f19ef23b1a278aba12fd53837f040a81@group.calendar.google.com',
                apiKey: process.env.GOOGLE_CALENDAR_API_KEY || 'AIzaSyCnYiuPZ2BSSx88j7eJjQ-WkXV5aIiDQ8E',
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                oauthClientId: process.env.GOOGLE_CLIENT_ID,
                oauthClientSecret: process.env.GOOGLE_CLIENT_SECRET
            }
        };

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
