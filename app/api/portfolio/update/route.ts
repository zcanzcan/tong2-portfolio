import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
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

    const adminSession = cookies['admin_session'];
    const ADMIN_ID = process.env.ADMIN_ID;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-for-dev';

    const expectedSessionValue = ADMIN_ID && ADMIN_PASSWORD
        ? btoa(`${ADMIN_ID}:${ADMIN_PASSWORD}:${sessionSecret}`).substring(0, 32)
        : null;

    return !!adminSession && adminSession === expectedSessionValue;
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

        // 중요: 캘린더나 비밀값 관련 섹션은 Sanitization(데이터 정제)을 건너뜁니다.
        const sanitizedData = section === 'calendar' ? data : sanitizeInput(data);

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

            console.log('[API] Updating profile with robust logic');

            const query = existing
                ? supabase.from('profile').update(profileData).eq('id', existing.id)
                : supabase.from('profile').insert(profileData);

            const { error, data: updateResult } = await query.select();
            if (error) {
                console.error('[API] Profile update error:', error);
                errorMsg = error.message;
            } else {
                console.log('[API] Profile update success');
                success = true;
            }

        } else if (['experience', 'heroButtons', 'socials', 'publications', 'projects', 'skills', 'certifications'].includes(section)) {
            const tableName = section === 'experience' ? 'experiences' :
                             section === 'heroButtons' ? 'hero_buttons' :
                             section === 'socials' ? 'social_links' :
                             section === 'publications' ? 'publications' :
                             section === 'skills' ? 'skills' :
                             section === 'certifications' ? 'certifications' : 'projects';

            console.log(`[API] Robust update with data integrity for ${tableName}`);

            if (Array.isArray(sanitizedData)) {
                // 1. 매핑 및 Upsert 데이터 준비 (ID 보존 필수)
                const upsertRows = sanitizedData.map((item: any, index: number) => {
                    // id 보존: 36자 UUID면 그대로, 아니면 서버측에서 새로 부여 (NOT NULL 보장)
                    const id = (item.id && typeof item.id === 'string' && item.id.length === 36)
                        ? item.id
                        : crypto.randomUUID();
                    const row: any = {
                        id,
                        sort_order: index,
                        updated_at: new Date().toISOString()
                    };

                    if (tableName === 'experiences') {
                        row.role = item.role;
                        row.role_en = item.roleEn || item.role_en;
                        row.company = item.company;
                        row.company_en = item.companyEn || item.company_en;
                        row.period = item.period;
                        row.period_en = item.periodEn || item.period_en;
                        row.color = item.color;
                    } else if (tableName === 'hero_buttons') {
                        row.text = item.text;
                        row.text_en = item.textEn || item.text_en;
                        row.icon = item.icon;
                        row.url = item.url;
                        row.variant = item.variant;
                        row.dropdown_items = item.dropdownItems || item.dropdown_items || [];
                    } else if (tableName === 'social_links') {
                        row.name = item.name;
                        row.icon = item.icon;
                        row.url = item.url;
                        row.color = item.color;
                    } else if (tableName === 'publications') {
                        row.tag = item.tag;
                        row.tag_en = item.tagEn || item.tag_en;
                        row.title = item.title;
                        row.title_en = item.titleEn || item.title_en;
                        row.description = item.description;
                        row.description_en = item.descriptionEn || item.description_en;
                        row.image = item.image;
                        row.link = item.link;
                        row.purchase_links = item.purchaseLinks || item.purchase_links || [];
                    } else if (tableName === 'projects') {
                        row.title = item.title;
                        row.title_en = item.titleEn || item.title_en;
                        row.description = item.description;
                        row.description_en = item.descriptionEn || item.description_en;
                        row.link = item.link;
                        row.tags = item.tags || [];
                        row.image = item.image;
                    } else if (tableName === 'skills') {
                        row.name = item.name;
                        row.icon = item.icon;
                        row.color = item.color;
                    } else if (tableName === 'certifications') {
                        row.name = item.name;
                        row.name_en = item.nameEn || item.name_en;
                        row.issuer = item.issuer;
                        row.issuer_en = item.issuerEn || item.issuer_en;
                        row.date = item.date;
                        row.url = item.url;
                    }
                    return row;
                });

                // 2. Upsert 실행 — db가 새로 부여한 UUID까지 받아와야 cleanup 보정이 가능
                const { data: upserted, error: upsertError } = await supabase
                    .from(tableName)
                    .upsert(upsertRows, { onConflict: 'id' })
                    .select('id');

                if (upsertError) {
                    console.error(`[API] Upsert Error for ${tableName}:`, upsertError);
                    throw new Error(`${tableName} 저장 중 오류: ${upsertError.message}`);
                }

                // 3. 지능형 삭제 — 삭제 대상 id를 명시적으로 골라 in() 으로 전달
                //    (supabase-js의 .not('id','in',array) 는 PostgREST 형식 직렬화 이슈로 PGRST100 떨어짐)
                const activeIds = new Set((upserted ?? []).map((r: any) => r.id).filter(Boolean));
                const { data: existingRows, error: listError } = await supabase
                    .from(tableName)
                    .select('id');

                if (listError) {
                    console.warn(`[API] Cleanup list warning for ${tableName}:`, listError);
                } else {
                    const idsToDelete = (existingRows ?? [])
                        .map((r: any) => r.id)
                        .filter((id: string) => id && !activeIds.has(id));
                    if (idsToDelete.length > 0) {
                        const { error: deleteError } = await supabase
                            .from(tableName)
                            .delete()
                            .in('id', idsToDelete);
                        if (deleteError) console.warn(`[API] Cleanup delete warning for ${tableName}:`, deleteError);
                    }
                }
                
                success = true;
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
        } else if (section === 'calendar') {
            const { data: existing } = await supabase.from('calendar_config').select('id').limit(1).maybeSingle();
            const calendarData = {
                calendar_id: sanitizedData.calendarId,
                api_key: sanitizedData.apiKey,
                refresh_token: sanitizedData.refreshToken,
                oauth_client_id: sanitizedData.oauthClientId,
                oauth_client_secret: sanitizedData.oauthClientSecret,
                updated_at: new Date().toISOString()
            };

            const query = existing
                ? supabase.from('calendar_config').update(calendarData).eq('id', existing.id)
                : supabase.from('calendar_config').insert(calendarData);

            const { error } = await query;
            if (error) errorMsg = error.message;
            else success = true;
        }

        if (success) {
            try {
                revalidateTag('portfolio'); // unstable_cache 무효화 — 새로고침 시 fresh data 반환
                revalidatePath('/');
                revalidatePath('/admin');
            } catch (revError) {
                console.warn('[API] Revalidation failed:', revError);
            }
            return NextResponse.json({ success: true, message: 'Updated successfully' });
        }

        return NextResponse.json({ error: errorMsg || 'Failed to save to Supabase' }, { status: 500 });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update data' }, { status: 500 });
    }
}
