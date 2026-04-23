# Leads Page (`/dashboard/leads`)

## Layout Structure
- Max-w-7xl container, centered
- Header with title + "Export CSV" button
- Summary tiles (3-column grid)
- Filters (wheel select + search input)
- Table with pagination

## Key Components

### Header
- Title: "Leads"
- Subtitle: "Contact details collected before each spin"

### Summary Tiles
- Total Leads (Users icon, violet)
- With Email (Mail icon, blue)
- With Phone (Phone icon, emerald)
- Each: top accent bar, icon, label, value (36px), sub label

### Filters
- Wheel selector dropdown
- Search input with icon (min-w-48, max-w-sm)
- Search button

### Table
Headers: Name, Email, Phone, Wheel, Prize, Coupon, GDPR, Date

- Hover state: bg-muted/30
- Empty state centered with icon + message
- Loading: spinner centered

### Special Cell Styling
- Prize won: violet badge
- Coupon: monospace code
- GDPR: emerald "Yes" / muted "No"

## Tailwind Classes Used
```
table, table-header, table-row, table-cell
grid-cols-3 gap-3
rounded-lg, p-5 pt-6
text-[36px] font-bold tabular-nums tracking-[-0.04em]
```

## Pagination
- Shows "Showing X-Y of Z leads"
- Previous/Next buttons
- Disabled states