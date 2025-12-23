import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-client';
import { sanitizeInput } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getServiceSupabase();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        
        // camelCase로 변환하여 프런트엔드 호환성 유지
        const formattedData = (data || []).map(item => ({
            id: item.id,
            title: item.title,
            titleEn: item.title_en,
            description: item.description,
            descriptionEn: item.description_en,
            link: item.link,
            tags: item.tags,
            image: item.image,
            sort_order: item.sort_order
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeInput(body);
        const supabase = getServiceSupabase();
        
        if (!sanitized.title) {
            return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
        }

        const projectData = {
            title: sanitized.title,
            title_en: sanitized.titleEn,
            description: sanitized.description,
            description_en: sanitized.descriptionEn,
            link: sanitized.link,
            tags: sanitized.tags || [],
            image: sanitized.image,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ message: 'Project added successfully', project: data });
    } catch (error) {
        console.error('Error adding project:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, project } = await request.json();
        const sanitized = sanitizeInput(project);
        const supabase = getServiceSupabase();
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const projectData = {
            title: sanitized.title,
            title_en: sanitized.titleEn,
            description: sanitized.description,
            description_en: sanitized.descriptionEn,
            link: sanitized.link,
            tags: sanitized.tags || [],
            image: sanitized.image,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update project' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const supabase = getServiceSupabase();
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete project' }, { status: 500 });
    }
}
