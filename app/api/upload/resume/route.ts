import { NextResponse } from 'next/server'
import path from 'path'
import { sanitizeFilename } from '@/lib/security'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic';

// Allowed document types for resume
const ALLOWED_TYPES = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/x-hwp', // HWP
    'application/haansofthwp', // HWP
    'application/vnd.hancom.hwp', // HWP
    'application/x-hwpl', // HWPX
    'application/vnd.hancom.hwpl', // HWPX
    'application/octet-stream', // Fallback for some file types
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (문서 파일은 이미지보다 클 수 있음)

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

        console.log('Resume upload request received:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
        })

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const supabase = getServiceSupabase()
        const bucket = process.env.SUPABASE_BUCKET || 'uploads'

        // Validate type
        const isAllowedType = ALLOWED_TYPES.includes(file.type) || file.type === ''
        if (!isAllowedType) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}` },
                { status: 400 }
            )
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 50MB limit' },
                { status: 400 }
            )
        }

        const originalExt = path.extname(file.name) || ''
        const base = sanitizeFilename(path.basename(file.name, originalExt) || 'resume')
        const safeExt = sanitizeFilename(originalExt || '.pdf')
        const fileName = `${base}_${Date.now()}${safeExt}`
        const objectPath = `resume/${fileName}`

        const arrayBuffer = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(objectPath, Buffer.from(arrayBuffer), {
                contentType: file.type || 'application/octet-stream',
                upsert: false
            })

        if (uploadError) {
            console.error('Supabase resume upload error:', uploadError)
            return NextResponse.json(
                { error: uploadError.message || 'Failed to upload resume file' },
                { status: 500 }
            )
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath)
        const publicPath = publicUrlData?.publicUrl || objectPath

        console.log('Resume file saved successfully:', objectPath)

        return NextResponse.json({
            success: true,
            path: publicPath,
            fileName,
            fileSize: file.size,
            fileType: file.type
        })

    } catch (error) {
        console.error('Resume upload error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to upload resume file',
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}

