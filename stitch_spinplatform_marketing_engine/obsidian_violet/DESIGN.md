# Design System Specification: The Event Horizon Editorial

## 1. Overview & Creative North Star
This design system is anchored by a Creative North Star we call **"The Event Horizon Editorial."** 

We have evolved the UI into a high-contrast, obsidian workspace. Instead of a bright void, we are treating the UI as a high-end, immersive chronograph captured at the edge of a deep-space nebula. The goal is to evoke the feeling of a premium physical timepiece resting on a dark, polished surface. We achieve this through a combination of deep "obsidian" surfaces, vibrant violet refractions, and sophisticated dark glass-morphism. 

To break the "template" look, designers must embrace **intentional asymmetry**. Use the `display-lg` typography to anchor layouts off-center, and allow glass elements to overlap one another to create a sense of three-dimensional depth within a moody, cinematic environment.

---

## 2. Colors & Surface Philosophy
The palette is built on high-contrast vibrance against a deep, dark foundation.

### The Palette
- **Primary Hub:** Use `primary` (#7C3AED) and `primary_container` (#A78BFA) for core brand actions.
- **The Accents:** `tertiary` (#10B981) represents "active" or "success" states (Emerald Green), while `error` handles alerts.
- **The Neutrals:** Surfaces are deep and immersive, utilizing the `neutral` base (#080810) to create a sense of infinite depth.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid white or black borders to section off content. Traditional dividers feel "cheap" and structural. Instead:
- **Tonal Transitions:** Define boundaries by placing a slightly lighter `surface_container_low` card on a deep `surface` background.
- **Light as Structure:** Use a subtle 1px inner glow (top-down) using `outline_variant` at 15% opacity to define an edge, rather than a heavy stroke.

### Glass & Gradient Soul
To achieve the "Premium" feel, floating elements (modals, dropdowns, hovering cards) must utilize **Glassmorphism**.
- **Recipe:** Use a dark surface at 60% opacity with a `24px` backdrop-blur. 
- **Gradients:** CTAs should never be flat. Use a linear gradient from `primary` (#7C3AED) to `secondary` (#A78BFA) at a 135-degree angle to simulate light hitting a polished violet gemstone in the dark.

---

## 3. Typography: Technical Authority
We pair the technical precision of **Space Grotesk** with the utilitarian clarity of **Inter**.

- **Display & Headlines (Space Grotesk):** These are your "Editorial" voices. Use tight letter-spacing (`-0.04em`) for `display-lg` and `headline-lg`. These should feel massive and commanding against the dark backdrop.
- **Body & Labels (Inter):** Reserved for data and long-form text. With our **Normal** spacing (level 2), ensure that white space is used generously around text blocks to maintain a clean, editorial aesthetic.
- **The "High-Tech" Label:** All `label-sm` and `label-md` elements should be in **ALL CAPS** with a letter-spacing of `0.08em` to mimic the labeling on high-end hardware.

---

## 4. Elevation & Depth: Tonal Layering
In this dark-mode design system, height is measured by subtle shifts in value and soft ambient glows.

### The Layering Principle
Think of the UI as layers of smoked glass and polished obsidian. 
1. **Base Layer:** The primary dark surface (#080810).
2. **Content Sections:** Subtle charcoal containers.
3. **Interactive Cards:** Deep surface containers.
4. **Floating Modals:** Glassmorphism over the primary content layers.

### Ambient Shadows & Light Leaks
Standard heavy shadows are invisible on dark surfaces; we use "Negative Space" and glows.
- **Ambient Lift:** For floating glass, use a large-spread, very soft shadow (blur: 40px) using a tinted version of the primary color at 5% opacity to create a "lifted" feel.
- **Focus Accents:** Elements that require high attention should emit a subtle violet "light leak" using a `0px 0px 15px` outer glow of the `primary` color.

---

## 5. Components

### Buttons (The "Power" Units)
- **Primary:** Gradient fill (`primary` to `secondary`), moderate (`2`) corner radius. On hover, increase the outer glow to simulate energy.
- **Secondary (Glass):** No fill. 1px "Ghost Border" (`outline_variant` at 30% opacity). Backdrop blur active.
- **Tertiary:** Text-only, `primary` color, all-caps `label-md` styling.

### Cards & Lists
- **The Container:** Never use dividers between list items. Use the standard vertical gap (spacing level 2).
- **Sectioning:** Separate distinct groups of information by shifting background tones rather than adding lines.
- **The Interaction:** On hover, a card should shift its background slightly lighter and its Ghost Border should become more defined.

### Input Fields
- **The State:** Inputs are deep, recessed surfaces. The label (`label-sm`) sits above the field in a muted neutral tone. 
- **Focus:** Upon focus, the "Ghost Border" illuminates into a solid 1px `primary` line with a subtle violet glow.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `tertiary` (#10B981) for "Success" actions; it provides a high-tech contrast against the dark violet theme.
- **Do** allow typography to overlap the edges of glass containers for an editorial, layered look.
- **Do** embrace the **Normal** spacing scale to give elements room to breathe, avoiding the cramped feel of technical dashboards.

### Don't:
- **Don't** use pure white (#FFFFFF) for body text. Use a light neutral-variant to maintain the premium "Editorial" atmosphere and reduce eye strain.
- **Don't** use standard drop shadows. In a dark environment, depth is created through luminance and rim-lighting.
- **Don't** use 100% opaque borders. The "Ghost Border" approach should always allow the background logic to feel continuous.
- **Don't** align everything to a rigid center. Use asymmetric typography to create a dynamic, professional flow.