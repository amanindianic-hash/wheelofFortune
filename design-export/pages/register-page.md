# Register Page (`/register`)

## Layout Structure
- Full-screen centered layout
- Card component with header + content + footer

## Key Components

### Background
- Subtle styling (p-4)

### Back Link
- Top-left absolute positioned
- ArrowLeft icon + "Back to Home"

### Card Header
- Logo button (centered, h-14 w-14)
- CardTitle: "Create your account"
- CardDescription: "Start building spin-to-win campaigns in minutes"

### Card Content
- Google sign-up button
- Divider "or sign up with email"
- Form fields:
  - Company Name (Input)
  - Your Name (Input)
  - Email (Input type="email")
  - Password (Input with show/hide toggle)

### Card Footer
- Create Account button (violet gradient)
- "Already have an account? Sign in" link

## Password Toggle
- Eye/EyeOff icon
- Positioned absolute right-3 top-1/2

## Validation
- Password minimum 8 characters
- Toast error on validation failure

## Tailwind Classes Used
```
min-h-screen flex items-center justify-center
w-full max-w-md shadow-xl glass-panel
rounded-2xl, bg-violet-600 hover:bg-violet-700
text-sm text-muted-foreground text-center
```

## Google Icon
- Same as login page (4-color SVG)