# Prizes Page (`/dashboard/prizes`)

## Layout Structure
- Max-w-4xl container, centered
- Header with title + "New Prize" button
- Prize list (table view with icon, name, type)
- Create dialog with form

## Key Components

### Header
- Title: "Prizes" (26px)
- Subtitle: "Define prizes that can be assigned to wheel segments"

### Prize List
- Card with overflow-hidden + no padding (table-like)
- Rows: icon, name, type, delete action on hover
- Icon colors based on prize type (violet, amber, blue, emerald, pink, slate)

### Prize Type Icons
```
coupon:       Tag
points:       Star
gift_card:    CreditCard
message:      MessageSquare
url_redirect: Link2
try_again:    RefreshCw
```

### Create Dialog
- Fields: Internal Name, Prize Type, Display Title, Display Description
- Conditional fields based on type:
  - Coupon: coupon mode (static/unique_pool/auto_generate), code, prefix/length, expiry
  - Points: points value
  - URL Redirect: redirect URL
  - Message: custom HTML

## Tailwind Classes Used
```
rounded-lg, rounded-xl, rounded-2xl
bg-violet-500/10, text-violet-600
border-dashed, border-border/50
hover:bg-muted/30, opacity-0 group-hover:opacity-100
```

## Empty State
- Gift icon in colored container
- "No prizes yet" heading
- Description text
- "Create Prize" CTA button