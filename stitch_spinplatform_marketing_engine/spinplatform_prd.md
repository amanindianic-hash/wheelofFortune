# System Design Prompt: SpinPlatform SaaS
## 1. Product Context
**Product Name:** SpinPlatform
**Industry:** SaaS / MarTech (Marketing Technology)
**Core Function:** A high-performance "Spin-to-Win" marketing engine used by e-commerce brands to capture leads via interactive fortune wheels.
**Target Audience:** Marketing managers, Shopify store owners, and Growth hackers.
## 2. Visual Identity & Brand Archetype
**Aesthetic:** "Deep Space Premium" — High-contrast, sleek, and high-tech.
**Primary Palette:** 
- **Core:** Deep Violet (#7C3AED), Electric Purple (#a78bfa).
- **Backgrounds:** Neutral Black (#080810) and Dark Gray (#12121A).
- **Accents:** Emerald Green (for success), Rose Red (for destructive actions), and subtle White glass-morphism.
**Typography:** Clean, geometric Sans-Serif (Inter or Outfit). Use tight letter spacing for headings (-0.04em).
**Logo Style:** A minimalist SVG logo featuring a timer/clock wheel inside a rounded violet square (#7C3AED).
## 3. UI Design Principles
- **Glassmorphism:** Use translucent backgrounds with `backdrop-blur` for cards and navigation bars.
- **Lighting:** Implement subtle radial glows and neon stroke effects around primary call-to-action buttons.
- **Micro-interactions:** Smooth hover scales (1.05x), subtle pulse animations for active states, and spring-based transitions.
- **Layout:** Bento-box style grid for dashboards, centered focus for authentication screens, and a responsive split-pane for the Wheel Editor.
## 4. Key Screen Requirements
### A. Landing Page
- **Hero Section:** Large, bold typography with a "Lead focused" headline. Include a high-fidelity 3D mockup of the Fortune Wheel.
- **Feature Grid:** Use glassmorphism cards with gradient icons.
- **Integration Strip:** Monochromatic partner logos (Shopify, Mailchimp) with low opacity.
### B. User Dashboard
- **Analytics Cards:** Clean line graphs showing "Spin Volume" and "Conversion Rates."
- **Wheel Management:** A list-view item with "Live" or "Draft" status indicators.
### C. The Wheel Editor
- **Left Panel:** Tabbed navigation for "Design," "Segments," "Form," and "Settings."
- **Center Stage:** The 1:1 Parity Live Preview — a large, crisp rendering of the wheel on a transparent or dot-grid background.
- **Property Controls:** Compact sliders, color hex-pickers, and toggle switches.
## 5. Technical Constraints for Code Generation
- Ensure the design is mobile-responsive.
- Use Semantic HTML5 elements.
- Implement CSS variables for the color palette (`--primary`, `--background`, etc.) to allow for easy theme switching.