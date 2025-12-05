import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string) || 'uploads';
        
        // 폴더명 검증 (경로 탐색 공격 방지)
        if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
            return NextResponse.json(
                { error: 'Invalid folder name' },
                { status: 400 }
            );
        }

        console.log('Upload request received:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
            folder
        });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', folder);

        // Import dynamically to avoid top-level await issues if any, though not needed here strictly
        const { saveUploadedFile } = await import('@/lib/upload-utils');

        const result = await saveUploadedFile({
            file,
            uploadDir,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            maxSize: 20 * 1024 * 1024, // 20MB
            useOriginalNameAsBase: true
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        console.log('File saved successfully:', result.fileName);

        const publicPath = `/${folder}/${result.fileName}`;

        return NextResponse.json({
            success: true,
            path: publicPath,
            fileName: result.fileName
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to upload file'
        }, { status: 500 });
    }
}

