# Login Page (`/login`)

## Layout Structure
- Full-screen centered layout
- Background with subtle radial glow
- Card with logo, title, form

## Key Components

### Background
- Radial glow (violet-600/5, blur-120px) behind card

### Back Link
- Top-left absolute positioned
- ArrowLeft icon + "Back to Home"

### Logo Block
- Centered flex column
- Logo button (h-14 w-14 rounded-2xl)
- Violet gradient with shadow glow
- SVG icon inside

### Title
- "Welcome back" (26px)
- "Sign in to your Wheel of Fortune dashboard"

### Card Content
- OAuth error banner (red bg)
- Google sign-in button with icon
- Divider with "or continue with email"
- Form fields: Email, Password

### Password Field
- Show/hide toggle button (Eye/EyeOff)
- "Forgot password?" link

### Footer
- Sign in button (violet gradient)
- "Don't have an account? Sign up free" link

## Tailwind Classes Used
```
min-h-screen flex items-center justify-center
rounded-2xl, glass-panel, shadow-xl
h-10 w-full, bg-violet-600 hover:bg-violet-500
text-sm text-muted-foreground text-center
```

## Google Icon
- SVG with Google colors (4-color logo)