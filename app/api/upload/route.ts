import { NextResponse } from 'next/server'
import path from 'path'
import { sanitizeFilename } from '@/lib/security'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (증가)

export const runtime = 'nodejs';

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

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const folder = (formData.get('folder') as string) || 'uploads'
        
        // 폴더명 검증 (경로 탐색 공격 방지)
        if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
            return NextResponse.json(
                { error: 'Invalid folder name' },
                { status: 400 }
            )
        }

        console.log('Upload request received:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
            folder
        })

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const bucket = process.env.SUPABASE_BUCKET || 'uploads'

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}` },
                { status: 400 }
            )
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size exceeds 20MB limit' },
                { status: 400 }
            )
        }

        // 파일명 생성: originalName_timestamp.ext
        const originalExt = path.extname(file.name) || ''
        const base = sanitizeFilename(path.basename(file.name, originalExt) || 'image')
        const safeExt = sanitizeFilename(originalExt || '.jpg')
        const fileName = `${base}_${Date.now()}${safeExt}`
        const objectPath = `${folder}/${fileName}`

        const arrayBuffer = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(objectPath, Buffer.from(arrayBuffer), {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return NextResponse.json(
                { error: uploadError.message || 'Failed to upload file' },
                { status: 500 }
            )
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath)
        const publicPath = publicUrlData?.publicUrl || objectPath

        console.log('File saved successfully:', objectPath)

        return NextResponse.json({
            success: true,
            path: publicPath,
            fileName
        })

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to upload file'
        }, { status: 500 })
    }
}

