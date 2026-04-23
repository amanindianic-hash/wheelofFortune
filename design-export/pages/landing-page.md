# Landing Page (`/`)

## Layout Structure
- Fixed navigation with logo, nav links, CTA buttons
- Hero section with radial glow background
- Browser mockup with wheel preview
- Features bento grid (6 features)
- How it works steps
- Integrations grid
- Pricing cards (3 tiers)
- Final CTA section
- Footer with link columns

## Key Components

### Navigation
- Logo: violet gradient box + "SpinPlatform" text
- Nav links: Features, How it works, Integrations, Pricing
- CTAs: Sign in (text), Start free (filled button)
- Mobile: hamburger menu with drawer

### Hero
- Eyebrow pill: "Spin-to-Win Marketing" with pulse dot
- Headline: "Turn every visitor into a lead." with gradient text
- Subheadline: description text
- CTAs: "Start for free" (gradient), "View live demo" (ghost)
- Hero visual: browser chrome mockup with wheel + lead form

### Features Bento
- 6 feature cards in 3-column grid
- Each has: icon, title, description
- Hover: accent glow at top, background shift, translate-y

### How It Works
- 3 steps with connector line
- Step badge with number, icon, title, description

### Integrations
- 12 integration tiles in 6-column grid
- Each has icon + name

### Pricing
- 3 pricing cards: Free, Starter (highlighted), Pro
- Highlight state: glowing border, "Most popular" badge

## Tailwind Classes Used
```
bg-background, text-white, dot-grid
glass-panel, ghost-border, gradient-text-editorial
font-editorial, label-caps
rounded-2xl, rounded-xl
px-6, py-3, gap-2
```

## CSS Variables
```
--color-primary: #7c3aed
--color-background: #13131b
--radius-lg: 0.75rem
```

## Animations/Transitions
- Button hover: scale, background shift
- Card hover: translateY(-2px), background change
- Feature hover: opacity 0→1 on top accent line