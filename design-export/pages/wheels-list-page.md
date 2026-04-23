# Wheels List Page (`/dashboard/wheels`)

## Layout Structure
- Max-w-5xl container, centered
- Header: title + "New Campaign" button
- Campaign list (grid of cards)
- Create dialog (modal)

## Key Components

### Header
- Title: "Campaigns" (40px, bold, tracking-tight)
- Subtitle: "Design and manage your interactive spin-to-win experiences"
- CTA Button: gradient fill, "New Campaign" with Plus icon

### Campaign Cards
- Glass panel styling with hover effects
- Visual marker: Disc3 icon in circular container with blur glow
- Content:
  - Wheel name (bold, tracking-tight)
  - Status pill (rounded-full, colored by status)
  - Spins count with label
  - Embed token (monospace, truncated)
- Actions:
  - Edit button (outline style with Pencil icon)
  - More menu (MoreHorizontal icon)

### Status Pills
```
Active:  bg-emerald-500/10, ring-emerald-500/20, text-emerald-400
        + pulsing dot animation
Paused:  bg-amber-500/10, ring-amber-500/20, text-amber-400
Draft:   bg-slate-500/10, ring-slate-500/20, text-slate-400
```

### Empty State
- Centered layout with glass-panel background
- Spinning Disc3 icon with blur glow
- "No campaigns found" heading
- Description text
- "Create your first wheel" CTA button

### Create Dialog
- Glass-panel dialog with rounded-[24px] corners
- Header: title + description
- Form: Label + Input field
- Footer: Cancel + "Initialize Campaign" buttons
- Input: dark bg, white/8 border, focus:primary/50

## Dropdown Menu Items
- Edit Campaign (Pencil icon)
- Pause/Activate Automation (Pause/Play icon)
- Delete Forever (Trash2 icon, rose-500)

## Tailwind Classes Used
```
glass-panel, rounded-2xl
hover:bg-white/[0.03], hover:scale-110
text-[15px], text-[10px], text-[11px]
font-bold, tracking-tight
rounded-full, rounded-lg
h-11 w-11, h-8 w-8
```

## Animations/Transitions
- Card hover: bg-white/[0.03], scale-110 on icon
- Button hover: scale-[1.02], active:scale-[0.98]
- Disc3 icon: animate-[spin_8s_linear_infinite] when active
- Status dot: animate-pulse when active

## Responsive
- Cards: flex-row on sm+, flex-col on mobile
- Token display: hidden on mobile (sm:flex)
- Edit button: hidden on mobile (sm:flex)