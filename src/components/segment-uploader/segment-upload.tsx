'use client';

import { useState, useRef } from 'react';
import { put } from '@vercel/blob';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, RotateCcw } from 'lucide-react';

interface SegmentUploadProps {
  themeId: string;
  onPreview?: (urls: (string | null)[]) => void;
  onSaveComplete?: (urls: (string | null)[]) => void;
}

export function SegmentUploader({ themeId, onPreview, onSaveComplete }: SegmentUploadProps) {
  const [files, setFiles] = useState<(File | null)[]>(Array(8).fill(null));
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(Array(8).fill(null));
  const [saving, setSaving] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);

  const handleFileSelect = (index: number, file: File | null) => {
    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);
  };

  const handlePreview = () => {
    const filledSlots = files.filter(f => f !== null).length;

    if (filledSlots === 0) {
      toast.error('Please select at least one segment image');
      return;
    }

    if (filledSlots !== 8) {
      toast.error(`Please upload all 8 segments (${filledSlots}/8 selected)`);
      return;
    }

    // Clean up old object URLs
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];

    // Create local blob URLs for preview (no upload needed!)
    const urls: (string | null)[] = Array(8).fill(null);
    files.forEach((file, idx) => {
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        urls[idx] = objectUrl;
        objectUrlsRef.current.push(objectUrl);
      }
    });

    setPreviewUrls(urls);
    onPreview?.(urls);
    toast.success('✅ Preview ready! Looks good? Click Save to upload.');
  };

  const handleSaveToDatabase = async () => {
    const filledUrls = previewUrls.filter(u => u !== null).length;
    if (filledUrls === 0) {
      toast.error('Preview images first');
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls: (string | null)[] = Array(8).fill(null);

      // Now upload to Vercel Blob
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const { url } = await put(
          `segment-images/${themeId}/segment-${i + 1}-${Date.now()}.png`,
          file,
          { access: 'public' }
        );

        uploadedUrls[i] = url;
      }

      // Save URLs to database
      const res = await fetch('/api/segments/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId, segmentUrls: uploadedUrls }),
      });

      if (!res.ok) {
        throw new Error('Failed to save segments to database');
      }

      toast.success('💾 Segments uploaded and saved!');
      onSaveComplete?.(uploadedUrls);
      setFiles(Array(8).fill(null));
      setPreviewUrls(Array(8).fill(null));

      // Clean up object URLs
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    } catch (err) {
      console.error('Save error:', err);
      toast.error('❌ Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setFiles(Array(8).fill(null));
    setPreviewUrls(Array(8).fill(null));
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    toast.success('Cleared');
  };

  const filledSlots = files.filter(f => f !== null).length;
  const hasPreview = previewUrls.some(u => u !== null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Segment Images</CardTitle>
        <CardDescription>Select 8 images → Preview → Save to upload</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grid of 8 segment upload slots */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 hover:border-primary/50 transition-colors bg-muted/20"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(i, e.target.files?.[0] || null)}
                disabled={saving}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                {files[i] ? (
                  <>
                    <div className="w-full aspect-square bg-foreground/5 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={URL.createObjectURL(files[i]!)}
                        alt={`Segment ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-green-600">✓ {files[i]!.name}</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl">🖼️</div>
                    <p className="text-xs font-semibold text-muted-foreground">Segment {i + 1}</p>
                    <p className="text-[10px] text-muted-foreground/60">Click to upload</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preview/Save buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePreview}
            disabled={saving || filledSlots === 0}
            size="lg"
            variant="outline"
          >
            👁️ Preview
          </Button>
          <Button
            onClick={handleSaveToDatabase}
            disabled={saving || !hasPreview}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {saving ? (
              <>💾 Uploading...</>
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </Button>
        </div>

        {/* Clear button */}
        {(filledSlots > 0 || hasPreview) && (
          <Button
            onClick={handleClear}
            disabled={saving}
            size="sm"
            variant="ghost"
            className="w-full"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Clear All
          </Button>
        )}

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center">
          {filledSlots}/8 segments selected
          {hasPreview && ' • Ready to save'}
        </p>
      </CardContent>
    </Card>
  );
}
