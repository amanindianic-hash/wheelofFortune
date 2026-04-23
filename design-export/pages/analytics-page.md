# Analytics Page (`/dashboard/analytics`)

## Layout Structure
- Full-width page with max-w-6xl container
- Header with filters
- 4-column stat cards grid
- Daily spins chart (full width)
- 2x2 breakdown grid (Prize, Segment, Device, OS)

## Key Components

### Header
- Title: "Analytics" (26px)
- Subtitle: "Spin performance and lead capture data"
- Filters:
  - Wheel selector (Select dropdown)
  - Date range (7/30/90 days)
  - Export CSV button (with Loader2 spinner state)

### Stat Cards (4-column grid)
Each card contains:
- Top accent bar (2px, gradient based on card type)
- Icon in colored background container
- Label (uppercase, muted)
- Value (36px, bold, tabular-nums)
- Hover: translate-y-0.5, shadow-lg

Card types:
1. Total Spins (BarChart2, violet)
2. Winners (Trophy, amber)
3. Unique Leads (Users, blue)
4. Win Rate (Percent, emerald)

### Daily Spins Chart
- Card container with header
- Dual-color bar chart (spins + winners)
- Hover tooltip showing date + spins + winners
- X-axis: date range labels
- Legend with color indicators

### Breakdown Cards (2x2 grid)
Each card contains:
- Title header
- List of rows with:
  - Label (truncate, capitalize)
  - Progress bar (24px wide, rounded-full)
  - Value (percentage or count)

Card types:
1. Prize Distribution - color: #7C3AED
2. Segment Hit Rate - color: #6366f1
3. Device Breakdown - color map (mobile:#7C3AED, desktop:#3B82F6, tablet:#10B981, unknown:#9CA3AF)
4. OS Breakdown - color map (iOS:#555, Android:#3DDC84, Windows:#0078D4, macOS:#A8A8A8, Linux:#E95420, Other:#9CA3AF)

## Tailwind Classes Used
```
grid grid-cols-2 lg:grid-cols-4
gap-3, gap-4
rounded-lg, p-5
from-violet-600 to-violet-400
text-[36px] font-bold tabular-nums tracking-[-0.04em]
```

## Chart Styling
```
h-32 (chart height)
h-px for grid lines
rounded-sm for bars
bg-violet-100 dark:bg-violet-900/30
```

## Empty States
- Chart: "No data in this period" centered text
- Breakdown: Same empty state pattern

## Responsive Behavior
- Stat cards: 4-col → 2-col → 1-col
- Breakdown grid: 2x2 → 1-col
- Filters stack on mobile