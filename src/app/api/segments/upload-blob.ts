import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const themeId = formData.get('themeId') as string;
    const files = formData.getAll('files') as File[];

    console.log('Upload request:', { themeId, fileCount: files.length });

    if (!themeId) {
      return errorResponse('MISSING_THEME_ID', 'Theme ID is required', 400);
    }

    if (!files || files.length === 0) {
      return errorResponse('NO_FILES', 'No files provided', 400);
    }

    if (files.length > 8) {
      return errorResponse('TOO_MANY_FILES', 'Maximum 8 files allowed', 400);
    }

    const uploadedUrls: string[] = [];

    // Upload each file to Vercel Blob
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as any;
      if (!file) continue;

      console.log(`Uploading file ${i + 1}:`, { name: file.name, size: file.size });

      const { url } = await put(
        `segment-images/${themeId}/segment-${i + 1}-${Date.now()}.png`,
        file,
        { access: 'public' }
      );

      console.log(`File ${i + 1} uploaded:`, url);
      uploadedUrls.push(url);
    }

    console.log('All files uploaded successfully:', uploadedUrls.length);

    return okResponse({
      success: true,
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error('Blob upload error:', err);
    return errorResponse(
      'UPLOAD_ERROR',
      'Failed to upload to Vercel Blob: ' + (err instanceof Error ? err.message : 'Unknown error'),
      500
    );
  }
}
