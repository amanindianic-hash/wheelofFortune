# Dynamic Segment Upload System - Integration Guide

## Overview
This system allows uploading custom segment images (8 per theme) to replace solid colors on wheel segments.

## What Was Built

### 1. Components Created
```
src/components/segment-uploader/
├── segment-upload.tsx      - Uploader with 8 slots, progress tracking
└── segment-preview.tsx     - Preview uploaded segments, swap/delete options
```

### 2. Database Changes
```sql
-- New table for storing segment images
CREATE TABLE theme_segment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES custom_themes(id),
  segment_position INT NOT NULL (1-8),
  image_url VARCHAR(2048) NOT NULL,
  image_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- New column on custom_themes
ALTER TABLE custom_themes ADD COLUMN 
  has_custom_segments BOOLEAN DEFAULT FALSE;
```

### 3. API Endpoints
```
POST /api/segments/upload
  - Upload 8 segment URLs to database
  - Input: { themeId, segmentUrls[] }
  - Output: { success, message, themeId, segmentCount }

GET /api/segments/[themeId]
  - Fetch segment images for a theme
  - Output: { themeId, segmentImages[], hasAllSegments }

DELETE /api/segments/[themeId]
  - Delete all segment images for a theme
  - Output: { success, message }
```

### 4. Wheel Renderer Update
```typescript
// WheelSegment interface now has:
segment_image_url?: string | null;

// In drawWheel():
- Checks if segment has segment_image_url
- If YES: renders image instead of solid color
- If NO: uses original gradient logic
```

---

## How to Integrate into Theme Tester

### Step 1: Add Segment Upload Section to Theme Tester Page

```typescript
// src/app/dashboard/theme-tester/page.tsx

import { SegmentUploader } from '@/components/segment-uploader/segment-upload';
import { SegmentPreview } from '@/components/segment-uploader/segment-preview';

// Inside your theme editor component:

const [selectedThemeId, setSelectedThemeId] = useState<string>('');
const [segmentImages, setSegmentImages] = useState<string[]>([]);

// Add this section to your UI:
<div className="space-y-6">
  {selectedThemeId && (
    <>
      <SegmentUploader 
        themeId={selectedThemeId}
        onUploadComplete={async (urls) => {
          setSegmentImages(urls);
          // Reload theme preview to show new segments
          await reloadThemePreview();
        }}
      />
      
      {segmentImages.length > 0 && (
        <SegmentPreview
          segmentUrls={segmentImages}
          onReplace={(idx, newUrl) => {
            // Handle segment replacement
          }}
          onSwap={(idx1, idx2) => {
            // Handle segment swap
          }}
        />
      )}
    </>
  )}
</div>
```

### Step 2: Load Segment Images When Theme Changes

```typescript
async function loadThemeSegments(themeId: string) {
  try {
    const res = await fetch(`/api/segments/${themeId}`);
    if (res.ok) {
      const { segmentImages } = await res.json();
      setSegmentImages(segmentImages);
    }
  } catch (err) {
    console.error('Error loading segments:', err);
  }
}

// Call when theme changes:
useEffect(() => {
  if (selectedThemeId) {
    loadThemeSegments(selectedThemeId);
  }
}, [selectedThemeId]);
```

### Step 3: Pass Segment Images to Wheel Preview

```typescript
// When rendering wheel preview:
<WheelPreview
  segments={segments.map((seg, idx) => ({
    ...seg,
    segment_image_url: segmentImages[idx], // Add custom image URL
  }))}
  config={config}
  branding={branding}
  rotation={rotation}
/>
```

---

## User Flow (In Theme Tester)

```
1. User selects a theme
   ↓
2. Segment images load from database (if any)
   ↓
3. User sees "Upload Segment Images" section
   ↓
4. User drags/clicks to upload 8 images
   ↓
5. Images upload to Vercel Blob Storage
   ↓
6. URLs saved to database
   ↓
7. Wheel preview updates in real-time
   ↓
8. User can:
   - Replace individual segments
   - Swap segments
   - Delete and re-upload
   ↓
9. Changes are live when wheel is published
```

---

## Testing Checklist

- [ ] Database schema created (`theme_segment_images` table)
- [ ] API endpoints working:
  - [ ] POST /api/segments/upload
  - [ ] GET /api/segments/[themeId]
  - [ ] DELETE /api/segments/[themeId]
- [ ] SegmentUploader component renders 8 slots
- [ ] Can upload images to each slot
- [ ] Images upload to Blob Storage successfully
- [ ] API saves URLs to database
- [ ] Wheel renderer checks for segment_image_url
- [ ] Segment images display on wheel preview
- [ ] SegmentPreview component shows uploaded images
- [ ] Theme tester integrates uploader
- [ ] Real-time preview updates when segments change

---

## File Summary

### New Components
- `src/components/segment-uploader/segment-upload.tsx` (318 lines)
- `src/components/segment-uploader/segment-preview.tsx` (97 lines)

### New API Routes
- `src/app/api/segments/upload.ts` (61 lines)
- `src/app/api/segments/[themeId]/route.ts` (79 lines)

### Modified Files
- `src/lib/utils/wheel-renderer.ts` (added segment_image_url support)

### Next Steps
1. Create database schema migration
2. Integrate into theme tester page
3. Test end-to-end flow
4. Add error handling
5. Add loading states

---

## Performance Notes

- Segment images are preloaded in image cache (existing system)
- Images are cached in browser for smooth rotation
- Uses Vercel Blob for CDN-fast delivery
- Lazy loading of images when needed

## Security Notes

- Images stored in public Blob storage
- Theme ownership verified before saving segments
- API checks theme exists before saving
- CORS enabled for image loading

---

## FAQ

**Q: Can I use the same image for multiple segments?**
A: Yes! Upload the same image to multiple slots.

**Q: What image formats are supported?**
A: PNG, JPG, WebP, GIF - any format supported by HTML Canvas.

**Q: Can I delete individual segments?**
A: Yes! Use the SegmentPreview component's delete button.

**Q: Do I need to re-upload if I change the theme name?**
A: No! Segments are linked by theme ID, so they persist.

**Q: What happens if I apply a theme without segments?**
A: Wheel uses the original solid color gradients - no error.

---

## Next Feature Ideas

- [ ] Auto-generate complementary segment images from Figma
- [ ] Segment image templates/presets
- [ ] Per-segment color overlay options
- [ ] Segment animation/transitions
- [ ] Bulk upload from ZIP file
