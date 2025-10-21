# Vyapar Vision

Comprehensive business management platform designed specifically for Nepal's retail ecosystem, starting with clothing and fashion retailers.

## Features

- **Point of Sale (POS)** - Fast transaction processing with invoice generation
- **Inventory Management** - Track stock levels, manage products, and get alerts
- **Customer Management** - Build relationships and track purchase history
- **Expense Tracking** - Categorize and monitor business expenses
- **Business Analytics** - Get insights into performance and trends
- **Nepal-Specific Features** - Nepali date support, local payment methods, and cultural considerations
- **Offline-First** - Works seamlessly even with poor internet connectivity
- **Mobile Optimized** - Perfect for mobile devices with touch-friendly interface

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod validation
- **PWA**: Service Worker, Offline support
- **Development**: ESLint, Prettier, Husky

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd vyapar-vision
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
│   ├── supabase/       # Supabase client configuration
│   ├── utils.ts        # General utilities
│   ├── nepal-utils.ts  # Nepal-specific utilities
│   └── config.ts       # App configuration
├── services/           # API services
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── middleware.ts       # Next.js middleware
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

### Git Workflow

- Pre-commit hooks run linting and formatting
- Use conventional commit messages
- Create feature branches for new development

### Testing

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys

## Nepal-Specific Features

### Date System

- Support for both AD and BS (Bikram Sambat) calendars
- Fiscal year management (Shrawan to Ashar)
- Festival calendar integration

### Localization

- English and Nepali language support
- NPR currency formatting with proper comma placement
- Lakhs/Crores number display system

### Business Practices

- Offline-first architecture for poor connectivity
- Mobile-first design for smartphone usage
- Touch-friendly interface with proper target sizes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@vyaparvision.com or join our community Discord.
