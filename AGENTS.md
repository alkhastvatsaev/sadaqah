# Sadaqah App - Project Architecture

## 1. Overview

**Sadaqah App** is a modern, fast, and extremely simple donation platform designed specifically for mosques. It allows users to make donations securely via Apple Pay, Google Pay, or Credit Card in just 3 seconds. The platform also provides dedicated portals for mosques to track their donations and an admin panel for global system management.

## 2. Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: Vanilla CSS (`app/globals.css`) focusing on performance, custom theming, and glassmorphism.
- **Payments**: [Stripe API](https://stripe.com) (`@stripe/stripe-js`, `@stripe/react-stripe-js` & `stripe` server-side SDK)
- **Email Service**: [Resend](https://resend.com/) (`resend` SDK)
- **Language**: TypeScript

## 3. Directory Structure

The project uses the Next.js **App Router** (`src/app/` directory).

```text
src/
└── app/
    ├── admin/               # Admin Control Center (Global visibility)
    ├── api/                 # Next.js Serverless API Routes
    │   ├── checkout/
    │   ├── create-payment-intent/
    │   └── mosquee/register/
    ├── mosquee/             # Mosque Portal
    │   ├── dashboard/       # Mosque statistics and donation history
    │   └── register/        # Mosque onboarding/registration form
    ├── globals.css          # Core design system & utilities
    ├── layout.tsx           # Global HTML layout
    └── page.tsx             # Main public-facing donation interface
```

## 4. Key Workflows & Routes

### A. Core Donation Flow (`app/page.tsx`)

1. The user lands on the main page featuring a dark, glassmorphic UI with faint Arabic calligraphy in the background.
2. The user selects a predefined amount (1€, 2€, 5€, 10€) or enters a custom amount, along with the name of the mosque they wish to support.
3. Clicking **"Faire un don"** generates a request to `api/create-payment-intent/route.ts`.
4. The backend initializes a Stripe `PaymentIntent` and returns a `clientSecret`.
5. The UI transitions to the `<CheckoutForm />` component which uses **Stripe Elements** (`PaymentElement`, `ExpressCheckoutElement` for Apple/Google Pay).
6. Upon successful payment, the user is shown a success screen ("Barakallahu feek").

### B. Mosque Portal (`app/mosquee/`)

- **`/mosquee/register`**: Allows mosque representatives to request an account. Form details are processed via `api/mosquee/register/route.ts`, which sends notification emails using **Resend**.
- **`/mosquee/dashboard`**: A private dashboard for verified mosques to view their total funds raised, total number of donations, and a real-time table of recent donors and payment methods.

### C. Admin & Manager Portal (`app/admin/`)

- **Stats & Overview**: Consolidates global system statistics (Total Platform Donations, Active Mosques, Unique Donors).
- **Validation Engine**: Displays a queue of pending mosques waiting for approval to join the platform.
- **System Health**: A developer-focused view displaying the status of the API Gateway, Stripe Integration, Database Connection, and live server logs.

## 5. Design System Integration

The app relies strictly on Vanilla CSS (`app/globals.css`) organized comprehensively to enforce a premium aesthetic:

- **Color Palette**: Dark theme (`#040702`) with an Emerald Green primary accent (`#10b981`) and a Gold secondary (`#d4af37`), symbolizing prosperity and tranquility.
- **Typography**: The modern sans-serif **Outfit** font.
- **Glassmorphism**: Achieved with the `.glass-card` class using `backdrop-filter: blur(20px)` layered over subtle surface borders (`rgba(255,255,255,0.1)`).
- **Animations**: CSS keyframe animations (like `fadeIn` and `scaleIn`) to make transitions fluid and visually pleasant.

## 6. Authentication & Security considerations

- All financial transactions strictly adhere to PCI-DSS standards by offloading processing entirely to Stripe Elements.
- The `stripe` library is initialized purely server-side (in Node APIs) ensuring the `STRIPE_SECRET_KEY` is never exposed to the client. The client exclusively uses the `STRIPE_PUBLISHABLE_KEY`.
