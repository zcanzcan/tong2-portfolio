import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        console.log('Resume upload request received:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
        });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'resume');

        const { saveUploadedFile } = await import('@/lib/upload-utils');

        const result = await saveUploadedFile({
            file,
            uploadDir,
            allowedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/x-hwp',
                'application/haansofthwp',
                'application/vnd.hancom.hwp',
                'application/x-hwpl',
                'application/vnd.hancom.hwpl',
                'application/octet-stream'
            ],
            allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.hwp', '.hwpx'],
            maxSize: 50 * 1024 * 1024, // 50MB
            filenamePrefix: 'resume'
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        console.log('Resume file saved successfully:', result.fileName);

        const publicPath = `/resume/${result.fileName}`;

        return NextResponse.json({
            success: true,
            path: publicPath,
            fileName: result.fileName,
            fileSize: file.size,
            fileType: file.type
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to upload resume file',
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

