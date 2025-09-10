# Overview

This is a Marketing Strategy Generator - a React-based web application that creates comprehensive marketing strategies using AI. The app collects user inputs about their business and generates detailed go-to-market strategies including STP analysis, 7 Ps of marketing, budget allocations, calendars, and KPIs. It features a modern single-page application design with a vintage office background, gradient tints, and optimized UX following digital design best practices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with functional components and hooks for UI state management
- **Vite** as the build tool providing fast development with Hot Module Reloading
- **Tailwind CSS** via CDN for utility-first styling approach
- **TypeScript support** configured but currently using JSX files
- **Component-based architecture** with modular, reusable UI components

## Styling Strategy
- **Tailwind CSS** for rapid UI development without custom CSS files
- **Google Fonts (Poppins)** for consistent typography
- **Vintage office photography** as foundation background with gradient color tints
- **Progressive disclosure** in report sections for optimal information consumption
- **Modern digital design principles** with proper visual hierarchy and readability optimization
- **Edge-to-edge responsive design** that works across all screen sizes

## API Integration
- **Cloudflare Workers** backend for serverless AI processing
- **OpenAI API** integration for generating marketing plans using structured JSON schema
- **RESTful API design** with POST endpoint for plan generation
- **CORS handling** for cross-origin requests

## Data Flow
- **Form-based input collection** for business parameters
- **JSON schema validation** ensuring consistent AI responses  
- **Enhanced structured output** including strategy pillars, personas, competitive analysis, differentiation moves, and risk assessments
- **UX-optimized report presentation** with collapsible sections, proper typography hierarchy, and progressive disclosure
- **Error handling** for API failures and malformed requests

## Development Environment
- **ES Modules** configuration for modern JavaScript
- **Vite dev server** configured for external access (host: '0.0.0.0')
- **TypeScript configuration** with strict mode enabled
- **React JSX transform** for optimized builds

# External Dependencies

## Core Dependencies
- **React & React DOM** (v18.2.0) - Frontend framework
- **@heroicons/react** (v2.2.0) - Icon library for UI components
- **Vite** (v5.0.0) - Build tool and development server
- **TypeScript** (v5.2.2) - Type safety and development tooling

## Styling Dependencies
- **Tailwind CSS** - Utility-first CSS framework (CDN)
- **Google Fonts** - Poppins font family (CDN)

## AI Services
- **OpenAI API** - GPT models for marketing plan generation
- **Cloudflare Workers** - Serverless backend hosting

## Development Tools
- **@vitejs/plugin-react** - React integration for Vite
- **@types/react** & **@types/react-dom** - TypeScript definitions