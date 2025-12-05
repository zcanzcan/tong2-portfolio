import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { sanitizeFilename } from './security';

export interface SaveFileOptions {
    file: File;
    uploadDir: string;
    allowedTypes?: string[];
    maxSize?: number;
    filenamePrefix?: string; // If provided, used as the base name (e.g. 'resume')
    useOriginalNameAsBase?: boolean; // If true, uses original filename as base (e.g. 'image')
    allowedExtensions?: string[]; // Additional check for extensions (useful for resumes)
}

export interface SaveFileResult {
    success: boolean;
    fileName?: string;
    fullPath?: string;
    error?: string;
    status?: number;
}

export async function saveUploadedFile(options: SaveFileOptions): Promise<SaveFileResult> {
    const {
        file,
        uploadDir,
        allowedTypes,
        maxSize,
        filenamePrefix,
        useOriginalNameAsBase,
        allowedExtensions
    } = options;

    // 1. Validate File Existence
    if (!file) {
        return { success: false, error: 'No file provided', status: 400 };
    }

    // 2. Validate File Type
    const originalFileName = file.name;
    const fileExtension = path.extname(originalFileName).toLowerCase();

    let isValidType = true;

    // Check MIME type if allowedTypes provided
    if (allowedTypes && allowedTypes.length > 0) {
        const isMimeValid = allowedTypes.includes(file.type);

        // If MIME check fails, check extensions if provided (fallback)
        if (!isMimeValid) {
            if (allowedExtensions && allowedExtensions.length > 0) {
                isValidType = allowedExtensions.includes(fileExtension) || file.type === '';
            } else {
                isValidType = false;
            }
        }
    } else if (allowedExtensions && allowedExtensions.length > 0) {
        // Only extensions provided
        isValidType = allowedExtensions.includes(fileExtension);
    }

    if (!isValidType) {
        return {
            success: false,
            error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes?.join(', ') || allowedExtensions?.join(', ')}`,
            status: 400
        };
    }

    // 3. Validate File Size
    if (maxSize && file.size > maxSize) {
        return {
            success: false,
            error: `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
            status: 400
        };
    }

    try {
        // 4. Create Directory
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 5. Generate Filename
        const timestamp = Date.now();
        let savedFileName = '';

        // Determine extension to use (prefer from file name)
        const ext = fileExtension || (file.type === 'image/jpeg' ? '.jpg' : '');

        if (useOriginalNameAsBase) {
            // Pattern: originalName_timestamp.ext
            const sanitizedOriginalName = sanitizeFilename(originalFileName);
            const baseName = path.basename(sanitizedOriginalName, ext) || 'file';
            savedFileName = `${baseName}_${timestamp}${ext}`;
        } else if (filenamePrefix) {
            // Pattern: prefix_timestamp.ext
            const sanitizedPrefix = sanitizeFilename(filenamePrefix);
            savedFileName = `${sanitizedPrefix}_${timestamp}${ext}`;
        } else {
            // Fallback
            savedFileName = `upload_${timestamp}${ext}`;
        }
        
        // 최종 파일명 검증
        savedFileName = sanitizeFilename(savedFileName);

        const filePath = path.join(uploadDir, savedFileName);

        // 6. Save File
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        return {
            success: true,
            fileName: savedFileName,
            fullPath: filePath
        };

    } catch (error) {
        console.error('File save error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save file',
            status: 500
        };
    }
}
