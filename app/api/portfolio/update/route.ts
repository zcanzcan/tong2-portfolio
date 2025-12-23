import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-client';
import { sanitizeInput, validateJSONSize } from '@/lib/security';

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
        if (!isAuthenticated(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        if (!validateJSONSize(body, 500)) {
            return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
        }

        const { section, data } = body;
        if (!section || data === undefined || data === null) {
            return NextResponse.json({ error: 'Missing section or data' }, { status: 400 });
        }

        const supabase = getServiceSupabase();
        const sanitizedData = sanitizeInput(data);

        let success = false;
        let errorMsg = '';

        if (section === 'profile') {
            const { data: existing } = await supabase.from('profile').select('id').limit(1).maybeSingle();
            const profileData = {
                name: sanitizedData.name,
                name_en: sanitizedData.nameEn,
                title: sanitizedData.title,
                title_en: sanitizedData.titleEn,
                bio: sanitizedData.bio,
                bio_en: sanitizedData.bioEn,
                status: sanitizedData.status,
                status_en: sanitizedData.statusEn,
                image: sanitizedData.image,
                updated_at: new Date().toISOString()
            };

            const query = existing 
                ? supabase.from('profile').update(profileData).eq('id', existing.id)
                : supabase.from('profile').insert(profileData);
            
            const { error } = await query;
            if (error) errorMsg = error.message;
            else success = true;

        } else if (['experience', 'heroButtons', 'socials', 'publications', 'projects', 'skills', 'certifications'].includes(section)) {
            const tableName = section === 'experience' ? 'experiences' : 
                             section === 'heroButtons' ? 'hero_buttons' :
                             section === 'socials' ? 'social_links' : 
                             section === 'publications' ? 'publications' : 
                             section === 'skills' ? 'skills' :
                             section === 'certifications' ? 'certifications' : 'projects';
            
            // 1. 기존 데이터 삭제
            await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // 2. 새 데이터 인서트
            if (Array.isArray(sanitizedData) && sanitizedData.length > 0) {
                const rowsToInsert = sanitizedData.map((item, index) => {
                    const row: any = { sort_order: index };
                    
                    if (tableName === 'experiences') {
                        row.role = item.role;
                        row.role_en = item.roleEn;
                        row.company = item.company;
                        row.company_en = item.companyEn;
                        row.period = item.period;
                        row.period_en = item.periodEn;
                        row.color = item.color;
                    } else if (tableName === 'hero_buttons') {
                        row.text = item.text;
                        row.text_en = item.textEn;
                        row.icon = item.icon;
                        row.url = item.url;
                        row.variant = item.variant;
                        row.dropdown_items = item.dropdownItems || [];
                    } else if (tableName === 'social_links') {
                        row.name = item.name;
                        row.icon = item.icon;
                        row.url = item.url;
                        row.color = item.color;
                    } else if (tableName === 'publications') {
                        row.tag = item.tag;
                        row.tag_en = item.tagEn;
                        row.title = item.title;
                        row.title_en = item.titleEn;
                        row.description = item.description;
                        row.description_en = item.descriptionEn;
                        row.image = item.image;
                        row.link = item.link;
                        row.purchase_links = item.purchaseLinks || [];
                    } else if (tableName === 'projects') {
                        row.title = item.title;
                        row.title_en = item.titleEn;
                        row.description = item.description;
                        row.description_en = item.descriptionEn;
                        row.link = item.link;
                        row.tags = item.tags || [];
                        row.image = item.image;
                    } else if (tableName === 'skills') {
                        row.name = item.name;
                        row.icon = item.icon;
                        row.color = item.color;
                    } else if (tableName === 'certifications') {
                        row.name = item.name;
                        row.name_en = item.nameEn;
                        row.issuer = item.issuer;
                        row.issuer_en = item.issuerEn;
                        row.date = item.date;
                        row.url = item.url;
                    }
                    return row;
                });

                const { error } = await supabase.from(tableName).insert(rowsToInsert);
                if (error) errorMsg = error.message;
                else success = true;
            } else {
                success = true;
            }
        } else if (section === 'blog') {
            const { data: existing } = await supabase.from('blog_info').select('id').limit(1).maybeSingle();
            const blogData = {
                title: sanitizedData.title,
                description: sanitizedData.description,
                url: sanitizedData.url
            };

            const query = existing 
                ? supabase.from('blog_info').update(blogData).eq('id', existing.id)
                : supabase.from('blog_info').insert(blogData);
            
            const { error } = await query;
            if (error) errorMsg = error.message;
            else success = true;
        }

        if (!success) {
            return NextResponse.json({ error: errorMsg || 'Failed to save to Supabase' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update data' }, { status: 500 });
    }
}
