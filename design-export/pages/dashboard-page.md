# Dashboard Page (`/dashboard`)

## Layout Structure
- Full-width page with max-w-7xl container
- Neural Header section with title + status pill
- Analytics Bento Matrix (12-column grid)
- Deployment Oversight section with wheel list
- Technical footer

## Key Components

### Header
- Eyebrow: "Neural Interface v4.0" with accent line
- Title: "System Telemetry"
- Subtitle with client name
- Status pill: "Active Protocol" with pulsing dot
- Refresh button (icon)

### Analytics Bento Matrix

#### Spin Activity Card (col-span-8)
- Header: label, title, efficiency delta badge
- Bar chart: 14 bars showing daily spins
- Last bar highlighted with glow
- Hover tooltip with spin count

#### Efficiency Card (col-span-4)
- Circular SVG progress indicator
- Center: conversion rate percentage
- Bottom: system samples stat with progress bar

#### Metric Modules (3 x col-span-4)
- Leads Aggregated (Users icon, primary color)
- Winners Synced (Trophy icon, emerald color)
- Neural Velocity (Zap icon, amber color)
- Each: icon container, value, label

### Active Deployments Section
- Section header with "All Systems" + "New Deployment" buttons
- Deployment list with connecting line
- Each wheel card shows:
  - Disc3 icon in visual marker
  - Wheel name (link)
  - Version badge
  - UUID
  - Spins count
  - Status pill (Active/Paused/Draft)
  - More menu dropdown

### Empty State
- Centered icon (Disc3) with blur glow
- "No active telemetry found" message
- "Start your first deployment" CTA

## Tailwind Classes Used
```
glass-panel, rounded-[2rem], rounded-[1.5rem]
p-10, p-7, p-5
text-4xl, text-2xl, text-xl
tabular-nums, tracking-tighter
font-editorial, font-heading
animate-ping, animate-[spin_6s_linear_infinite]
```

## CSS Effects
```
box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5)
box-shadow: 0 0 30px rgba(124,58,237,0.4)
text-shadow with glow for status indicators
gradient fills on accent bars
```

## Responsive Behavior
- Grid: 12 columns → stacked on mobile
- Wheel cards: flex-row → flex-col on mobile
- Metrics: 3-column → 1-column on small screens