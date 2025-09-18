# Marketing Strategy Generator

AI-powered marketing strategy generator that creates comprehensive marketing plans in 20 seconds using OpenAI's GPT-4o.

## Features

- **🎯 Comprehensive Strategies**: Complete marketing plans including market analysis, customer personas, 7 Ps, budgets, and KPIs
- **⚡ Fast Generation**: Professional strategies in ~20 seconds
- **🔒 Enterprise Security**: Bot protection, rate limiting, and input validation
- **🇬🇧 British English**: All content optimized for UK markets
- **📱 Responsive Design**: Works perfectly on all devices
- **🎨 Professional UI**: Clean, modern interface with vintage office aesthetics

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers with OpenAI API
- **Security**: Multi-tier rate limiting and bot protection
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (API)

## Deployment

This app is deployed using GitHub + Cloudflare Pages for automatic deployments:

1. **Frontend**: `marketingstratgenerator.com` (Cloudflare Pages)
2. **API**: `api.marketingstratgenerator.com` (Cloudflare Workers)

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5000` to see the app.

## Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.