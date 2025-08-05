# API Generator

A web-based developer tool that enables users to generate complete, production-ready APIs from natural language descriptions.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
├── components/          # Reusable React components
├── services/           # Business logic and API services
├── utilities/          # Helper functions and utilities
├── types/              # TypeScript type definitions
├── lib/                # Library functions and configurations
└── test/               # Test setup and utilities
```

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Run tests with coverage
- `pnpm type-check` - Run TypeScript type checking

## Development Environment

This project is configured with:

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** for styling
- **ESLint** and **Prettier** for code quality
- **Vitest** and **Testing Library** for testing
- **pnpm** for package management
