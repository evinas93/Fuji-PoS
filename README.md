# Fuji Restaurant POS System

A comprehensive Point of Sale (POS) system designed specifically for Fuji Restaurant to streamline operations, enhance customer service, and provide real-time business insights.

## 🚀 Project Overview

The Fuji POS System is a modern, cloud-based solution that replaces traditional paper-based ordering with a digital platform featuring:

- **Digital Menu Management** - Real-time menu updates with pricing variations
- **Touch-Optimized Ordering** - Intuitive interface for servers and cashiers
- **Automated Payment Processing** - Integrated with Stripe for secure transactions
- **Real-Time Analytics** - Live sales tracking and comprehensive reporting
- **Kitchen Display System** - Seamless communication between front and back of house
- **Role-Based Access Control** - Secure multi-user system with defined permissions

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Supabase account
- Stripe account (for payment processing)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/fuji-restaurant/pos-system.git
cd pos-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

Run the Supabase migrations:

```bash
npx supabase db push
```

### 5. Start Development Server

```bash
npm run dev:all
```

This will start both the Next.js frontend (http://localhost:3000) and the Express.js backend server.

## 📁 Project Structure

```
fuji-pos-system/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Next.js pages
│   ├── lib/            # Utility libraries
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles
│   └── utils/          # Helper functions
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
├── public/             # Static assets
├── tests/              # Test files
└── docs/               # Documentation
```

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## 📝 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🔐 Security

- All payment processing is handled through Stripe's PCI-compliant infrastructure
- User authentication and authorization via Supabase Auth
- Row Level Security (RLS) policies implemented in database
- Environment variables for sensitive configuration
- HTTPS enforced in production

## 📊 Features by Role

### Servers

- Digital order taking
- Table management
- Order modifications
- Payment processing

### Managers

- Real-time sales dashboard
- Comprehensive reporting
- User management
- Menu administration

### Kitchen Staff

- Order queue display
- Preparation tracking
- Order completion

### Cashiers

- Payment processing
- Receipt generation
- Order lookup

## 🚀 Deployment

The application is designed to be deployed on:

- **Frontend**: Vercel/Netlify
- **Database**: Supabase (managed)
- **Backend API**: Vercel Edge Functions / Railway

## 📞 Support

For technical support or questions, please contact the development team.

## 📄 License

This project is proprietary software for Fuji Restaurant. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: September 2025
