# Metrics Hub

A modern, full-featured marketing analytics dashboard for tracking and analyzing advertising campaigns across multiple platforms (Meta Ads, Google Ads) with lead management and real-time insights.

## 🚀 Features

- **Multi-Platform Analytics**: Unified dashboard for Meta Ads and Google Ads campaigns
- **Lead Management**: Comprehensive lead tracking with qualification scoring and distributions
- **Real-Time Insights**: AI-powered insights and smart alerts for campaign performance
- **PWA Support**: Installable progressive web app with offline capabilities
- **White Label**: Customizable branding and theming
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Built-in theme switching
- **Advanced Filtering**: Filter campaigns by status, objective, date range with comparison mode
- **Data Visualization**: Interactive charts and graphs powered by Recharts
- **User Management**: Role-based access control with admin panel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend and authentication)
- Meta Ads and/or Google Ads integration credentials

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Metrics-Hub/metrics-hub.git
cd metrics-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the `.env.example` file to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://your_project_id.supabase.co
```

> ⚠️ **Important**: Never commit the `.env` file to version control. It contains sensitive credentials.

### 4. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📦 Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview production build

```bash
npm run preview
```

## 🧪 Development

### Project Structure

```
metrics-hub/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions and helpers
│   ├── integrations/   # External service integrations
│   └── config/         # Configuration files
├── supabase/           # Supabase functions and migrations
├── public/             # Static assets
└── scripts/            # Build and utility scripts
```

### Code Quality

The project uses:
- **TypeScript** with strict mode enabled
- **ESLint** for code linting
- **Custom Logger** for environment-aware logging (dev vs production)

Run linting:

```bash
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Radix UI, TailwindCSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **PWA**: Vite PWA Plugin

## 🔐 Authentication

The application uses Supabase Authentication. Users must sign in to access the dashboard. Admin users have additional privileges for user management and system configuration.

## 📊 Integrations

### Meta Ads
Configure Meta Ads integration in the Admin panel to sync campaign data.

### Google Ads
Set up Google Sheets integration for Google Ads data import.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, please contact the development team or open an issue in the repository.

---

**Version**: 0.1.0  
**Last Updated**: December 2025
