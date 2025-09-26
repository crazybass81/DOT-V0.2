# Quick Start Guide

## Prerequisites
- Node.js 18+ and npm 8+
- Git installed
- GitHub account
- Vercel account (free)
- Supabase account (free)

## 1. Initial Setup (10 minutes)

### Clone and Install
```bash
# Clone the repository
git clone [your-repo-url]
cd DOT-V0.2

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables
Create `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="DOT Platform"
NEXT_PUBLIC_DEFAULT_LANGUAGE=ko
```

## 2. Supabase Setup (15 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy API keys from Settings > API

### Database Setup
```bash
# Run migrations
npm run supabase:migrate

# Seed initial data (optional)
npm run supabase:seed
```

### Enable Authentication
1. Go to Authentication > Providers
2. Enable Email/Password
3. Optional: Enable OAuth (Google, GitHub)

## 3. Local Development (5 minutes)

### Start Development Server
```bash
# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

### Available Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:e2e": "playwright test",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit"
}
```

## 4. Project Structure

```
DOT-V0.2/
├── app/                   # Next.js App Router
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Protected pages
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # UI components (shadcn)
│   └── features/        # Feature components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── store/               # Zustand store
├── types/               # TypeScript types
├── public/              # Static assets
└── tests/               # Test files
```

## 5. Vercel Deployment (10 minutes)

### Connect Repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repository
3. Select branch: `main`

### Configure Build
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Environment Variables
Add the same variables from `.env.local` in Vercel dashboard

### Deploy
Click "Deploy" and wait for build completion

## 6. GitHub Setup

### Create Repository
```bash
# Initialize git (if needed)
git init

# Add remote
git remote add origin [your-repo-url]

# Create feature branch
git checkout -b feature/initial-setup

# Commit and push
git add .
git commit -m "Initial setup"
git push -u origin feature/initial-setup
```

### Branch Protection
1. Go to Settings > Branches
2. Add rule for `main`
3. Enable: Require PR reviews
4. Enable: Require status checks

## 7. Development Workflow

### Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
npm run dev

# Test changes
npm run test
npm run lint

# Commit
git add .
git commit -m "feat: your feature"

# Push and create PR
git push origin feature/your-feature
```

### Code Quality
```bash
# Before committing
npm run typecheck
npm run lint:fix
npm run format
npm run test
```

## 8. Common Tasks

### Add New Page
```bash
# Create new route
mkdir app/(dashboard)/new-page
touch app/(dashboard)/new-page/page.tsx
```

### Add UI Component
```bash
# Install shadcn component
npx shadcn-ui@latest add button
```

### Add Database Table
```sql
-- Create migration
npm run supabase:migration:new your_table

-- Edit migration file in supabase/migrations/
-- Run migration
npm run supabase:migrate
```

### Test Locally
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## 9. Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Supabase connection error**
- Check environment variables
- Verify Supabase project is running
- Check network connection

**Build errors**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**Type errors**
```bash
# Regenerate types
npm run supabase:types
```

## 10. Next Steps

1. **Customize UI**
   - Update `app/layout.tsx` for branding
   - Modify `tailwind.config.ts` for theme

2. **Add Features**
   - Implement authentication flow
   - Create dashboard pages
   - Add real-time subscriptions

3. **Configure CI/CD**
   - Set up GitHub Actions
   - Add automated testing
   - Configure deployment pipeline

4. **Production Readiness**
   - Enable monitoring (Vercel Analytics)
   - Set up error tracking (Sentry)
   - Configure backups

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## Support

- GitHub Issues: [your-repo-url]/issues
- Documentation: `.specify/docs/`
- Discord: [if applicable]