import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/upload — upload an image and return a permanent public URL
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return errorResponse('VALIDATION_ERROR', 'No file provided.', 400);
    if (!file.type.startsWith('image/')) return errorResponse('VALIDATION_ERROR', 'Only image files are allowed.', 400);
    if (file.size > 5 * 1024 * 1024) return errorResponse('VALIDATION_ERROR', 'File too large. Max 5 MB.', 400);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const filename = `wheel-images/${auth.user.client_id}/${Date.now()}.${ext}`;

    const blob = await put(filename, file, { access: 'public' });
    return okResponse({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse('INTERNAL_ERROR', 'Upload failed.', 500);
  }
}
