'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SegmentPreviewProps {
  segmentUrls: (string | null)[];
  onReplace?: (index: number, newUrl: string) => void;
  onSwap?: (index1: number, index2: number) => void;
}

export function SegmentPreview({ segmentUrls, onReplace, onSwap }: SegmentPreviewProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const uploadedCount = segmentUrls.filter((url) => url !== null).length;

  if (!segmentUrls || segmentUrls.length === 0 || uploadedCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Segment Images</CardTitle>
          <CardDescription>No segments uploaded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Segment Images Preview</CardTitle>
        <CardDescription>{uploadedCount} of 8 custom segment images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid of segment previews */}
        <div className="grid grid-cols-4 gap-3">
          {segmentUrls.map((url, i) => (
            url && (
              <div
                key={i}
                onClick={() => setSelectedSegment(selectedSegment === i ? null : i)}
                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedSegment === i
                    ? 'border-primary ring-2 ring-primary/50'
                    : 'border-muted-foreground/20 hover:border-primary/50'
                }`}
              >
                <img
                  src={url}
                  alt={`Segment ${i + 1}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">{i + 1}</span>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Action buttons for selected segment */}
        {selectedSegment !== null && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReplace?.(selectedSegment, '');
                setSelectedSegment(null);
              }}
            >
              🗑️ Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSwap?.(selectedSegment, (selectedSegment + 1) % 8);
                setSelectedSegment(null);
              }}
            >
              🔄 Swap with Next
            </Button>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Click on a segment to select it • {uploadedCount} image{uploadedCount !== 1 ? 's' : ''} loaded
        </p>
      </CardContent>
    </Card>
  );
}
