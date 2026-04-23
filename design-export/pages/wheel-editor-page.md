# Wheel Editor Page (`/dashboard/wheels/[id]`)

## Layout Structure
- Full-width page with tabs navigation
- Left: Tabbed configuration panels (Design, Segments, Distribution, Settings, Templates, Form)
- Right: Live preview panel + QR code + Share dialog

## Key Components

### Status Badge
- Full-width pill with icon + label
- Production: emerald bg, pulsing dot
- Draft: amber bg, static dot

### Tab Navigation
Tabs:
1. Design - wheel appearance customization
2. Segments - segment configuration (list + add)
3. Distribution - spin probability settings
4. Settings - general wheel settings
5. Templates - theme templates
6. Form - lead capture form fields

Tab styling:
- Active: text-primary, scale-105
- Inactive: text-muted-foreground

### Preview Monitor (Right Panel)
- Live wheel preview with real-time updates
- Segments visual with colors/text
- Pointer indicator
- Responsive sizing

### Distribution Tab
- QR Code display (configurable size)
- URL display with copy button
- Size selector (128/256/512)

### Share Dialog
- Glass-panel modal
- QR code preview
- URL with copy action
- Close button

### Save as Theme Dialog
- Name input field
- Save / Cancel buttons

## Component States

### Saving States
- Saving button: shows "Saving..." with spinner
- Theme saving: similar pattern

### Error States
- Toast notifications for errors
- "Neural uplink failed" message

## Tailwind Classes Used
```
rounded-full, rounded-xl
h-8 w-8, h-10 w-10
bg-emerald-500/10, border-emerald-500/20
text-[10px] font-black uppercase tracking-widest
```

## Icons Used
```
ArrowLeft, Share2, Monitor, Code, QrCode
Palette, Type, Globe, Users, Layers, Zap
Search, Link, Download, Lock
```

## Animations
- Wheel spin animation in preview
- Tab transition effects
- Button loading states

## Responsive
- Side-by-side → stacked on mobile
- Preview panel moves below config on small screens