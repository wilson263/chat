import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Sparkles, Wand2, Copy, Check, RefreshCw, Download,
  Figma, Palette, Layout, Smartphone, Monitor, Layers,
  Lightbulb, Star, Zap, Eye, Code2, PenLine, Globe, Server,
  Database, ShoppingCart, Gamepad2, Brain, Shield, CreditCard,
  Bell, Users, MessageSquare, BarChart3, Lock, Wifi, Cloud,
  Package, Rocket, PlaySquare, Apple, Chrome, Terminal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── MODES ────────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'fullstack', label: 'Full Stack Web App', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Frontend + Backend + DB + Auth' },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', desc: 'Android & iOS — Play Store ready' },
  { id: 'uiux', label: 'UI/UX Design', icon: Figma, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', desc: 'Figma / Canva / Prototype prompts' },
  { id: 'backend', label: 'Backend / API', icon: Server, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', desc: 'REST / GraphQL API server' },
  { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', desc: 'Full shop with payments' },
  { id: 'game', label: 'Game', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', desc: 'Browser or mobile game' },
  { id: 'ai', label: 'AI / ML App', icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', desc: 'AI-powered application' },
  { id: 'dashboard', label: 'Dashboard / SaaS', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', desc: 'Admin panel / analytics SaaS' },
];

// ─── APP TYPES ────────────────────────────────────────────────────────────────
const APP_TYPES: Record<string, string[]> = {
  fullstack: ['Social Media Platform', 'Task & Project Manager', 'Blog / CMS', 'Job Board', 'Real Estate Platform', 'Booking & Reservation System', 'Forum / Community', 'Learning Management System', 'Event Management', 'Health & Fitness Platform', 'Recipe & Food App', 'Travel & Tourism', 'News & Magazine', 'Portfolio / Personal Site', 'Video Streaming Platform', 'Music Platform', 'Marketplace'],
  mobile: ['Social Networking App', 'Food Delivery App', 'Ride Sharing App', 'Fitness Tracker', 'Finance & Banking App', 'Shopping App', 'Dating App', 'Education App', 'Health & Medication Tracker', 'Chat & Messaging App', 'Video Calling App', 'Maps & Navigation', 'News Reader', 'Todo & Productivity App', 'Travel Companion', 'Music Player', 'Photo Editor', 'Games App', 'Crypto Wallet', 'IoT Controller'],
  uiux: ['Social Media App', 'E-Commerce Platform', 'Task Manager', 'Dashboard/Analytics', 'Food Delivery App', 'Fitness App', 'Finance App', 'Education Platform', 'Travel App', 'Chat App', 'Portfolio', 'SaaS Tool', 'Medical App', 'Real Estate App', 'News App', 'Music App'],
  backend: ['Authentication Service', 'Payment Processing API', 'File Upload Service', 'Real-time Notification API', 'E-Commerce API', 'Social Graph API', 'Analytics Service', 'Email & SMS Service', 'Search Service', 'Content Management API', 'IoT Data API', 'Webhook Service'],
  ecommerce: ['Fashion & Clothing Store', 'Electronics Store', 'Grocery Delivery', 'Digital Products Store', 'Handmade Crafts Marketplace', 'B2B Wholesale Platform', 'Subscription Box Service', 'Food & Beverage Shop', 'Books & Media Store', 'Sports & Outdoors', 'Beauty & Cosmetics', 'Multi-vendor Marketplace'],
  game: ['Endless Runner', 'Puzzle Game', 'Platformer', 'Tower Defense', 'Word Game', 'Card Game', 'Trivia / Quiz Game', 'Clicker / Idle Game', 'RPG', 'Strategy Game', 'Sports Game', 'Racing Game'],
  ai: ['AI Chatbot', 'Image Generation App', 'Text Summarizer', 'AI Writing Assistant', 'Code Review Bot', 'Sentiment Analysis Tool', 'Resume Builder with AI', 'AI Voice Assistant', 'Document Q&A', 'AI Image Editor', 'Recommendation Engine', 'AI Translator'],
  dashboard: ['Analytics Dashboard', 'CRM System', 'HR Management System', 'Inventory Management', 'Financial Dashboard', 'Project Management Tool', 'Customer Support Portal', 'Marketing Analytics', 'Sales Pipeline', 'Fleet Management', 'School Management System', 'Hospital Management'],
};

// ─── TECH STACKS ──────────────────────────────────────────────────────────────
const TECH_STACKS: Record<string, { id: string; label: string }[]> = {
  fullstack: [
    { id: 'react-node', label: 'React + Node.js + PostgreSQL' },
    { id: 'nextjs', label: 'Next.js 14 + Prisma + PostgreSQL' },
    { id: 'react-fastapi', label: 'React + FastAPI + PostgreSQL' },
    { id: 'vue-node', label: 'Vue.js + Node.js + MongoDB' },
    { id: 'react-django', label: 'React + Django + PostgreSQL' },
    { id: 'nuxtjs', label: 'Nuxt.js + Node.js + MongoDB' },
  ],
  mobile: [
    { id: 'react-native-expo', label: 'React Native + Expo (Recommended)' },
    { id: 'flutter', label: 'Flutter + Dart' },
    { id: 'react-native-cli', label: 'React Native CLI' },
    { id: 'ionic', label: 'Ionic + Angular' },
  ],
  backend: [
    { id: 'express', label: 'Node.js + Express + PostgreSQL' },
    { id: 'fastapi', label: 'Python + FastAPI + PostgreSQL' },
    { id: 'nestjs', label: 'NestJS + TypeORM + PostgreSQL' },
    { id: 'django', label: 'Django REST Framework' },
    { id: 'go-gin', label: 'Go + Gin + PostgreSQL' },
    { id: 'springboot', label: 'Spring Boot + PostgreSQL' },
  ],
  ecommerce: [
    { id: 'react-node', label: 'React + Node.js + Stripe + PostgreSQL' },
    { id: 'nextjs-stripe', label: 'Next.js + Stripe + Prisma' },
    { id: 'react-django', label: 'React + Django + Stripe + PostgreSQL' },
  ],
  game: [
    { id: 'js-canvas', label: 'Vanilla JS + HTML Canvas' },
    { id: 'phaser', label: 'Phaser.js (Browser Game)' },
    { id: 'react-game', label: 'React + CSS Animations' },
    { id: 'react-native-game', label: 'React Native (Mobile Game)' },
  ],
  ai: [
    { id: 'react-openai', label: 'React + Node.js + OpenAI API' },
    { id: 'nextjs-openai', label: 'Next.js + OpenAI API' },
    { id: 'react-groq', label: 'React + Node.js + Groq API' },
    { id: 'python-langchain', label: 'Python + LangChain + FastAPI' },
  ],
  dashboard: [
    { id: 'react-node', label: 'React + Node.js + PostgreSQL + Recharts' },
    { id: 'nextjs', label: 'Next.js + Prisma + PostgreSQL + Chart.js' },
    { id: 'react-django', label: 'React + Django + PostgreSQL' },
    { id: 'vue-node', label: 'Vue.js + Node.js + MongoDB' },
  ],
};

// ─── FEATURES ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { id: 'auth', label: 'Authentication (JWT)', icon: Lock },
  { id: 'social-auth', label: 'Social Login (Google/GitHub)', icon: Chrome },
  { id: 'payments', label: 'Payments (Stripe)', icon: CreditCard },
  { id: 'push-notif', label: 'Push Notifications', icon: Bell },
  { id: 'realtime', label: 'Real-time (WebSocket)', icon: Wifi },
  { id: 'chat', label: 'In-app Chat / Messaging', icon: MessageSquare },
  { id: 'roles', label: 'User Roles & Permissions', icon: Users },
  { id: 'file-upload', label: 'File & Image Upload', icon: Cloud },
  { id: 'search', label: 'Search & Filters', icon: Zap },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'email', label: 'Email Notifications', icon: Bell },
  { id: 'api', label: 'Public REST API', icon: Server },
  { id: 'pwa', label: 'PWA / Offline Support', icon: Package },
  { id: 'dark-mode', label: 'Dark Mode', icon: Eye },
  { id: 'i18n', label: 'Multi-language (i18n)', icon: Globe },
  { id: '2fa', label: 'Two-Factor Auth (2FA)', icon: Shield },
];

// ─── DEPLOY TARGETS ───────────────────────────────────────────────────────────
const DEPLOY_TARGETS: Record<string, { id: string; label: string; icon: any }[]> = {
  fullstack: [
    { id: 'render', label: 'Render', icon: Cloud },
    { id: 'vercel', label: 'Vercel + Railway', icon: Rocket },
    { id: 'aws', label: 'AWS (EC2 + RDS)', icon: Cloud },
    { id: 'digitalocean', label: 'DigitalOcean', icon: Cloud },
    { id: 'heroku', label: 'Heroku', icon: Cloud },
    { id: 'vps', label: 'VPS / Linux Server', icon: Terminal },
  ],
  mobile: [
    { id: 'playstore', label: 'Google Play Store', icon: PlaySquare },
    { id: 'appstore', label: 'Apple App Store', icon: Apple },
    { id: 'both', label: 'Both Stores', icon: Smartphone },
    { id: 'apk', label: 'APK Only (Android)', icon: Package },
  ],
  backend: [
    { id: 'render', label: 'Render', icon: Cloud },
    { id: 'railway', label: 'Railway', icon: Rocket },
    { id: 'aws', label: 'AWS Lambda / EC2', icon: Cloud },
    { id: 'docker', label: 'Docker + VPS', icon: Package },
  ],
  ecommerce: [
    { id: 'vercel', label: 'Vercel (Frontend) + Railway (Backend)', icon: Rocket },
    { id: 'render', label: 'Render (Full Stack)', icon: Cloud },
    { id: 'aws', label: 'AWS', icon: Cloud },
  ],
};

// ─── UI/UX TOOLS ──────────────────────────────────────────────────────────────
const UIUX_TOOLS = [
  { id: 'figma', label: 'Figma', icon: Figma },
  { id: 'canva', label: 'Canva', icon: Palette },
  { id: 'general', label: 'General UX/UI', icon: Layout },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
  { id: 'web', label: 'Web App', icon: Monitor },
  { id: 'prototype', label: 'Prototype', icon: Layers },
];

const STYLE_VIBES = [
  'Minimalist & Clean', 'Bold & Colorful', 'Dark Mode Premium', 'Glassmorphism',
  'Neumorphism', 'Corporate & Professional', 'Playful & Fun', 'Luxury & High-end',
  'Retro & Vintage', 'Material Design', 'Flat Design', 'Gradient Heavy',
];

const SCREEN_TYPES = [
  'Onboarding Flow', 'Dashboard Home', 'Login & Signup', 'Profile Page',
  'Settings Screen', 'Product Listing', 'Product Detail', 'Checkout Flow',
  'Feed / Timeline', 'Search Results', 'Navigation & Menu', 'Empty States',
  'Error Pages', 'Loading States', 'Modal & Popups', 'Data Tables',
];

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

const POWER_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ NON-NEGOTIABLE BUILD STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Write minimum 1500 lines of code total across all files
✅ Every single function must be FULLY implemented — no stubs, no TODOs
✅ Every file must be complete — never truncate with "..." or "// rest of code"
✅ Use real database queries — never hardcode data
✅ Include ALL screens, pages, routes, and endpoints mentioned
✅ Connect frontend to backend with proper error handling
✅ Add loading states, error states, and empty states everywhere
✅ Make the UI beautiful with Tailwind CSS and shadcn/ui components
✅ Output format: label each file clearly as === folder/filename.ext ===`;

function buildFullStackPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.fullstack.find(s => s.id === opts.techStack) || TECH_STACKS.fullstack[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);
  const deployLabel = DEPLOY_TARGETS.fullstack.find(d => d.id === opts.deployTarget)?.label || 'Render';
  const targetUsersLine = opts.targetUsers ? `\n**Target Users:** ${opts.targetUsers}` : '';

  return `Build a complete, production-ready full-stack web application called "${opts.appName || 'MyApp'}" — a ${opts.appType || 'web platform'}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Tech Stack:** ${stackLabel}
**Deployment:** ${deployLabel}${targetUsersLine}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND — ALL PAGES (fully implemented)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Landing page with hero section, features, CTA
• Authentication: Login, Register, Forgot Password pages
• Dashboard / Home (after login) with real data from API
• All core feature pages for a ${opts.appType}
• Profile page with editable settings
• 404 / Error page
• Responsive navbar with mobile hamburger menu
• Footer with links

Every page must have:
  ➜ Full UI components (no placeholder boxes)
  ➜ API integration with React Query hooks
  ➜ Loading skeletons while data loads
  ➜ Error boundaries with retry buttons
  ➜ Form validation with error messages
  ➜ Mobile-first responsive design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API — ALL ENDPOINTS (fully implemented)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST   /api/auth/register   — register with bcrypt password hashing
POST   /api/auth/login      — JWT access + refresh tokens
POST   /api/auth/refresh    — refresh token rotation
POST   /api/auth/logout     — token blacklisting
GET    /api/auth/me         — current user profile
Full CRUD endpoints for all core resources of a ${opts.appType}
GET    /api/health          — health check

Middleware:
  ➜ JWT auth middleware (protect routes)
  ➜ Rate limiting (100 req/15min per IP)
  ➜ Helmet security headers
  ➜ CORS with allowed origins
  ➜ Request validation (Zod schemas)
  ➜ Global error handler
  ➜ Request logger (Morgan)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE — COMPLETE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Complete Prisma schema (or SQL) with all tables, relations, indexes
• Migrations
• Seed file with 10-20 realistic sample records per table
• Connection pooling configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL FULLY BUILT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ Core CRUD operations\n✅ Search and filtering\n✅ Pagination'}
✅ Full CRUD operations with optimistic UI updates
✅ Search, filter, and sort on all list views
✅ Pagination (10 items per page with controls)
✅ File/image upload with preview
✅ Toast notifications for all actions
✅ Dark mode toggle (Tailwind dark: classes)
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE (create all these files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
frontend/
  src/pages/         (all pages)
  src/components/    (reusable UI components)
  src/hooks/         (useAuth, useToast, custom query hooks)
  src/lib/           (api client, utils)
  src/types/         (TypeScript interfaces)
  vite.config.ts, tailwind.config.ts, package.json

backend/
  src/routes/        (all API route files)
  src/controllers/   (business logic)
  src/middleware/     (auth, validation, errors)
  src/services/      (database queries)
  src/utils/         (helpers, validators)
  server.ts, package.json

database/
  prisma/schema.prisma (or schema.sql)
  prisma/seed.ts

config/
  .env.example       (ALL required variables with descriptions)
  docker-compose.yml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — start to finish, no truncation
2. Label each file: === folder/filename.ext ===
3. End with:
   ### ⚡ Quick Start (step-by-step commands)
   ### 🔧 Environment Variables (all .env values explained)
   ### 🚀 Deploy to ${deployLabel} (complete deployment steps)`;
}

function buildMobilePrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.mobile.find(s => s.id === opts.techStack) || TECH_STACKS.mobile[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);
  const deployTarget = opts.deployTarget || 'both';
  const storeInfo = deployTarget === 'playstore' ? 'Google Play Store' : deployTarget === 'appstore' ? 'Apple App Store' : 'Both Google Play Store and Apple App Store';
  const bundleId = `com.${(opts.appName || 'myapp').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`;

  return `Build a complete, production-ready mobile app called "${opts.appName || 'MyApp'}" — a ${opts.appType || 'mobile app'} — READY FOR SUBMISSION to ${storeInfo}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stackLabel} — with TypeScript, Expo Router, NativeWind for styling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL APP SCREENS (fully built — zero placeholders)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• app/_layout.tsx           — root layout with providers
• app/(auth)/login.tsx      — email + password login, show/hide, validation
• app/(auth)/register.tsx   — full signup form with all fields, validation
• app/(auth)/forgot.tsx     — forgot password with email flow
• app/(tabs)/_layout.tsx    — bottom tab bar with 4-5 tabs and icons
• app/(tabs)/index.tsx      — home/main screen with real content from API
• app/(tabs)/[feature].tsx  — all feature-specific screens for ${opts.appType}
• app/profile.tsx           — view and edit profile, avatar upload
• app/settings.tsx          — notifications, theme, account settings, logout
• app/onboarding.tsx        — 3-slide onboarding for new users

Every screen must have:
  ➜ Full React Native + NativeWind UI (not placeholder boxes)
  ➜ API calls with loading/error/empty states
  ➜ Keyboard handling (KeyboardAvoidingView + ScrollView)
  ➜ SafeAreaView properly configured
  ➜ Pull-to-refresh on list screens
  ➜ Haptic feedback on button presses

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API (Node.js + Express + PostgreSQL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/register   — register
POST /api/auth/login      — JWT login
POST /api/auth/refresh    — refresh token
All CRUD endpoints needed for ${opts.appType}
File upload endpoint (for profile pictures)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL IMPLEMENTED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ JWT Authentication\n✅ Push notifications'}
✅ Expo Router file-based navigation
✅ Zustand state management
✅ AsyncStorage for offline data
✅ Expo Image for optimized images
✅ Dark mode support
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP CONFIG (app.json + eas.json)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• App name: "${opts.appName || 'MyApp'}"
• Bundle ID (Android): ${bundleId}
• Bundle ID (iOS): ${bundleId}
• Version: 1.0.0, versionCode: 1
• Permissions: Camera, Notifications, MediaLibrary (if needed)
• Splash screen and app icon config
• EAS Build profiles: development, staging, production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Label each file: === path/filename.ext ===
3. End with:
   ### ⚡ Quick Start (expo go + local dev commands)
   ### 🔧 Environment Variables
   ### 🚀 Publish to ${storeInfo} (step-by-step: EAS Build → store submission)`;
}

function buildBackendPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.backend.find(s => s.id === opts.techStack) || TECH_STACKS.backend[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready REST API server called "${opts.appName || 'MyAPI'}" — a ${opts.appType || 'backend service'}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stackLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ENDPOINTS (ALL fully implemented with controllers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth Routes:
  POST   /api/auth/register   — register + send welcome email
  POST   /api/auth/login      — login + return JWT pair
  POST   /api/auth/logout     — blacklist refresh token
  POST   /api/auth/refresh    — rotate refresh tokens
  GET    /api/auth/me         — get current user
  PATCH  /api/auth/me         — update profile
  POST   /api/auth/forgot     — send reset email
  POST   /api/auth/reset      — reset password

Core Resource Routes (full CRUD for ${opts.appType}):
  GET    /api/[resource]              — list with filter, sort, pagination
  POST   /api/[resource]             — create with validation
  GET    /api/[resource]/:id         — get by ID
  PUT    /api/[resource]/:id         — full update
  PATCH  /api/[resource]/:id         — partial update
  DELETE /api/[resource]/:id         — soft delete
  GET    /api/[resource]/search?q=   — full-text search

System:
  GET    /api/health    — health check
  GET    /api/docs      — Swagger UI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY & MIDDLEWARE (all implemented)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Helmet.js (15+ security headers)
✅ CORS with whitelist
✅ Rate limiting: 100 req/15min general, 5 req/min for auth
✅ JWT middleware with token blacklisting
✅ Zod request validation on all endpoints
✅ SQL injection prevention (parameterized queries)
✅ XSS sanitization (express-validator)
✅ Request logging (Morgan with custom format)
✅ Global error handler (dev vs prod messages)
✅ Graceful shutdown handler

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE — COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Full schema with all tables, foreign keys, indexes, constraints
• Migration files numbered sequentially
• Seed script with realistic sample data (20+ records per table)
• Prisma (or raw SQL) with connection pooling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL BUILT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ JWT authentication\n✅ File upload\n✅ Email service'}
✅ Swagger/OpenAPI docs auto-generated
✅ Pagination with cursor + offset modes
✅ Full-text search
✅ File upload with S3/Cloudinary
✅ Background job queue (Bull)
✅ Caching layer (Redis)
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Label each file: === path/filename.ext ===
3. End with: API endpoint reference table + Quick Start + Docker deployment guide`;
}

function buildEcommercePrompt(opts: any): string {
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready e-commerce platform called "${opts.appName || 'MyShop'}" — ${opts.appType || 'an online store'} with real Stripe payment processing.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Query
Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL + Stripe + Nodemailer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND PAGES (all complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• / Home — hero banner, featured products, categories, promotions
• /products — grid with search, category filter, price range, sort, pagination
• /products/:slug — product detail, image gallery, variants, reviews, add to cart
• /cart — cart items, quantity controls, remove, subtotal, promo code
• /checkout — shipping address → payment (Stripe Elements) → order summary → confirm
• /orders — order history list
• /orders/:id — order detail with tracking timeline
• /account — profile, addresses, payment methods, preferences
• /auth/login + /auth/register — full auth forms
• /admin — dashboard with revenue, orders, inventory overview
• /admin/products — products CRUD with image upload
• /admin/orders — order management with status updates
• /admin/customers — customer list and details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API (all endpoints)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth: register, login, refresh, me
Products: list (filter/sort/paginate), get, create, update, delete, search
Categories: full CRUD
Cart: get cart, add, update qty, remove, apply coupon
Orders: create, list, get, update status (admin)
Stripe: create-checkout-session, webhook (payment_intent.succeeded)
Reviews: create, list by product, update, delete
Users (admin): list, get, ban
Analytics: revenue over time, top products, order stats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL IMPLEMENTED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ Stripe Payments\n✅ JWT Auth\n✅ Image Upload'}
✅ Stripe Checkout Sessions with webhooks
✅ Product variants (size, color) with inventory tracking
✅ Shopping cart (persisted for logged-in users)
✅ Coupon/discount codes with validation
✅ Product reviews with star ratings and moderation
✅ Order status emails (confirmation, shipped, delivered)
✅ Admin role-based access control
✅ Wishlist / Saved items
✅ Recently viewed products
✅ Related products recommendations
✅ Inventory alerts (low stock notifications)
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Label each file: === path/filename.ext ===
3. End with: Stripe setup guide + .env variables + Quick Start + Vercel/Railway deployment`;
}

function buildGamePrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.game.find(s => s.id === opts.techStack) || TECH_STACKS.game[0]).label;

  return `Build a complete, fully playable ${opts.appType || 'browser game'} called "${opts.appName || 'MyGame'}" using ${stackLabel}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Complete game loop: start screen → gameplay → game over → leaderboard → restart
✅ Main menu with animated background, high score display, play button, instructions
✅ Pause menu (ESC key or pause button) with resume/restart/quit
✅ Game over screen with final score, new high score animation, social share button
✅ Smooth 60fps animation using requestAnimationFrame or game loop
✅ Sound effects using Web Audio API (synthesized — no external files needed)
✅ Background music (procedurally generated or toggle on/off)
✅ Persistent high score with localStorage
✅ Mobile controls: touch gestures + on-screen D-pad/buttons
✅ Keyboard controls: arrow keys, WASD, space

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME MECHANICS (fully implemented for ${opts.appType})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Complete physics and collision detection system
✅ Scoring system with combos and multipliers
✅ Difficulty curve: speed/complexity increases over time
✅ Power-ups with visual indicators and countdown timers
✅ Enemy AI with multiple behavior patterns
✅ Particle effects (explosions, collection, trails)
✅ Screen shake for impact
✅ Achievement system (first kill, 1000 points, etc.)
✅ Multiple levels or endless mode with level indicators

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pixel-art or vector aesthetic that fits ${opts.appType}
✅ Animated sprites or canvas-drawn entities
✅ Color-coded elements (player, enemies, power-ups, obstacles)
✅ HUD: score, lives/health, level, timer
✅ Animated transitions between screens
✅ Responsive canvas that scales to any screen size
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Files: index.html, styles.css, game.js (or split into modules)
3. Label each: === filename.ext ===
4. End with: Controls guide + Features list + How to host on GitHub Pages / Netlify`;
}

function buildAIPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.ai.find(s => s.id === opts.techStack) || TECH_STACKS.ai[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready AI-powered application called "${opts.appName || 'MyAI'}" — ${opts.appType || 'an AI tool'} using ${stackLabel}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND — ALL SCREENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Landing page — value prop, demo GIF/animation, pricing, CTA, testimonials
• Auth pages — login, register with Google OAuth option
• Main AI interface:
  - Clean input area (textarea or chat bubbles)
  - Streaming AI responses with typewriter cursor effect
  - Conversation history with timestamps
  - Copy to clipboard button on each response
  - Thumbs up/down feedback buttons
  - Model selector dropdown (GPT-4, Gemini, Claude)
  - Temperature/creativity slider
  - System prompt customization panel
  - Clear conversation button
• History page — saved conversations list with search
• Settings page — API keys, preferences, usage limits
• Usage dashboard — tokens used, requests made, cost estimate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST   /api/chat/stream          — SSE streaming AI response
POST   /api/chat/message         — single response (non-streaming)
GET    /api/chat/history         — list saved conversations
POST   /api/chat/save            — save conversation
DELETE /api/chat/:id             — delete conversation
GET    /api/usage                — token usage stats
POST   /api/keys                 — save API key (encrypted)

AI Integration:
  ➜ Server-Sent Events (SSE) for real-time streaming
  ➜ Context window management: auto-summarize old messages
  ➜ Token counting before sending requests
  ➜ Fallback chain: primary model → fallback model → error
  ➜ API key rotation for load balancing
  ➜ Response caching for identical queries (Redis)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL BUILT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ Streaming responses\n✅ Conversation history'}
✅ Prompt library with 20+ pre-built templates by category
✅ Export conversation as PDF, Markdown, or plain text
✅ Share conversation as public link
✅ Image generation integration (DALL-E or Stable Diffusion)
✅ Code syntax highlighting in responses
✅ File upload for document analysis (PDF, TXT, CSV)
✅ Voice input (Web Speech API)
✅ Response feedback (thumbs up/down) stored to DB
✅ Rate limiting per user per day
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Label each file: === path/filename.ext ===
3. End with: API key setup guide + .env variables + Deployment guide`;
}

function buildDashboardPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.dashboard.find(s => s.id === opts.techStack) || TECH_STACKS.dashboard[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready ${opts.appType || 'admin dashboard'} called "${opts.appName || 'MyDashboard'}" using ${stackLabel}.
${POWER_RULES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND PAGES (all complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• /login — auth with remember me, password visibility toggle
• /dashboard — KPI cards (4), line chart (7-day trend), bar chart (by category), recent activity feed, quick actions
• /[resource] — data table with: search, multi-column sort, filter panel, bulk select, CSV export, pagination
• /[resource]/:id — detail view with edit form and related data
• /[resource]/new — create form with all validations
• /users — user management with role assignment, status toggle, invite by email
• /analytics — time-series charts, heatmap, funnel analysis, date range picker
• /reports — exportable reports (PDF, Excel) with templates
• /settings — profile, notifications, security (2FA), appearance, integrations
• /audit-log — timestamped activity log with filters

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARTS & VISUALIZATIONS (using Recharts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Line chart — trends over time with tooltips and zoom
✅ Bar chart — comparison by category
✅ Pie/Donut chart — distribution percentages
✅ Area chart — cumulative metrics
✅ DataTable — sort, filter, inline edit, bulk delete, export
✅ Stat cards with trend arrows and percentage change

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth: login, logout, refresh, me, change password, 2FA
Dashboard: GET /api/dashboard/stats — aggregated KPIs
Full CRUD with filter, sort, pagination for all resources
Users: list, get, create, update role, deactivate, invite
Analytics: GET /api/analytics — time-series data with date range
Export: GET /api/export/:resource — CSV/Excel generation
Audit: GET /api/audit-log — paginated activity log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES (ALL BUILT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureLabels.length > 0 ? featureLabels.map((f: string) => `✅ ${f}`).join('\n') : '✅ Role-based auth\n✅ Data export'}
✅ Role-based access: Admin, Manager, Viewer (different UI per role)
✅ Date range picker with presets (Today, 7D, 30D, 90D, Custom)
✅ Real-time data refresh (WebSocket or 30-sec polling)
✅ Bulk operations (delete, update status, assign)
✅ Column visibility toggle in data tables
✅ Inline cell editing with auto-save
✅ Full audit log with user, action, timestamp, changes
✅ Email alerts for threshold breaches
✅ Keyboard shortcuts (K for search, N for new)
✅ Dark / light mode toggle
${opts.extraNotes ? `✅ ${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Write every file completely — no truncation
2. Label each file: === path/filename.ext ===
3. End with: .env variables + Quick Start + Deployment steps`;
}

function buildUIUXPrompt(opts: any): string {
  const toolLabel = UIUX_TOOLS.find(t => t.id === opts.uiuxTool)?.label || opts.uiuxTool;
  const screenList = opts.selectedScreens.length > 0 ? opts.selectedScreens.join(', ') : 'all key screens';
  return `Design a complete, production-ready UI/UX design system for a ${opts.appType || 'modern app'} called "${opts.appName || 'MyApp'}" — optimized for ${toolLabel}.

**Design Style:** ${opts.styleVibe || 'Modern & Clean'}
${opts.targetUsers ? `**Target Users:** ${opts.targetUsers}` : ''}
${opts.colorPalette ? `**Brand Colors:** ${opts.colorPalette}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREENS TO DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${screenList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Visual Design:**
• Pixel-perfect layout with consistent 8pt grid system
• Stunning hero sections with gradients, illustrations, or abstract shapes
• Micro-animations described in detail (hover states, transitions, loading)
• Depth hierarchy using shadows (xs: 2px, sm: 4px, md: 8px, lg: 16px)
• Modern design trends appropriate to "${opts.styleVibe || 'the selected style'}"

**Design System Components (describe all with exact specs):**
• Color palette: primary, secondary, accent, neutral, semantic (error/success/warning)
• Typography scale: headings (H1-H6), body, caption, label — with font, weight, size, line-height
• Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
• Component library: Button (5 variants), Input, Select, Checkbox, Radio, Toggle, Badge, Card, Modal, Toast, Tooltip, Dropdown, Tabs, Table, Avatar, Breadcrumb
• Icon system: which icon library and usage rules
• Illustration style: when and how to use

**Accessibility:**
• Color contrast ratios (WCAG AA — 4.5:1 for text)
• Focus states for keyboard navigation
• Screen reader-friendly patterns
• Reduced motion considerations

**Responsive Breakpoints:**
• Mobile: 375px — primary design focus
• Tablet: 768px — adapted layout
• Desktop: 1440px — wide layout with sidebar

**Interaction Design:**
• Loading states (skeletons, spinners, progress)
• Error states (friendly error messages with recovery actions)
• Empty states (illustration + CTA)
• Success states (animations, confirmations)
• Hover / Active / Disabled states for all interactive elements

${opts.extraNotes ? `**Special Requirements:**\n${opts.extraNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Complete design descriptions for all screens with pixel-level detail
2. Full design system specification (colors, typography, spacing, components)
3. Interaction design patterns for each screen
4. Developer handoff notes with exact CSS values
5. Figma/code implementation notes
6. User flow diagram description (onboarding through key action)`;
}

function buildPrompt(mode: string, opts: any): string {
  switch (mode) {
    case 'fullstack': return buildFullStackPrompt(opts);
    case 'mobile': return buildMobilePrompt(opts);
    case 'backend': return buildBackendPrompt(opts);
    case 'ecommerce': return buildEcommercePrompt(opts);
    case 'game': return buildGamePrompt(opts);
    case 'ai': return buildAIPrompt(opts);
    case 'dashboard': return buildDashboardPrompt(opts);
    case 'uiux': return buildUIUXPrompt(opts);
    default: return buildFullStackPrompt(opts);
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function PromptGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState('fullstack');
  const [appName, setAppName] = useState('');
  const [selectedAppType, setSelectedAppType] = useState('');
  const [selectedTechStack, setSelectedTechStack] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedDeploy, setSelectedDeploy] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [styleVibe, setStyleVibe] = useState('');
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [uiuxTool, setUiuxTool] = useState('figma');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleFeature = (id: string) => setSelectedFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleScreen = (s: string) => setSelectedScreens(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setSelectedAppType('');
    setSelectedTechStack('');
    setSelectedFeatures([]);
    setSelectedDeploy('');
    setGeneratedPrompt('');
  };

  const handleGenerate = async () => {
    if (!selectedAppType) {
      toast({ title: 'Please select an app type first', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    const prompt = buildPrompt(mode, {
      appName,
      appType: selectedAppType,
      techStack: selectedTechStack,
      features: selectedFeatures,
      deployTarget: selectedDeploy,
      extraNotes,
      targetUsers,
      colorPalette,
      styleVibe,
      selectedScreens,
      uiuxTool,
    });
    setGeneratedPrompt(prompt);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast({ title: 'Prompt copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedPrompt) return;
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zorvixai-prompt-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Prompt downloaded!' });
  };

  const handleReset = () => {
    setAppName(''); setSelectedAppType(''); setSelectedTechStack('');
    setSelectedFeatures([]); setSelectedDeploy(''); setExtraNotes('');
    setTargetUsers(''); setColorPalette(''); setStyleVibe('');
    setSelectedScreens([]); setGeneratedPrompt('');
  };

  const currentAppTypes = APP_TYPES[mode] || APP_TYPES.fullstack;
  const currentTechStacks = TECH_STACKS[mode] || [];
  const currentDeployTargets = DEPLOY_TARGETS[mode] || DEPLOY_TARGETS.fullstack;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[350px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-blue-500/5 to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">AI Prompt Generator</span>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Mode Selector */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What are you building?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODES.map(m => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${active ? `${m.bg} ${m.border} border` : 'border-border/40 hover:border-border bg-card/40 hover:bg-card/70'}`}
                >
                  <Icon className={`w-5 h-5 ${active ? m.color : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{m.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 leading-tight hidden sm:block">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left panel — config */}
          <div className="lg:col-span-2 space-y-4">

            {/* App Name */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <Label className="text-sm font-semibold mb-2 block">App / Project Name</Label>
              <Input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder={mode === 'game' ? 'e.g. Pixel Runner, Space Blast' : mode === 'mobile' ? 'e.g. FitTrack, ShopNow' : 'e.g. TaskFlow, ShopHub'}
                className="bg-background/50 border-border/40"
              />
            </div>

            {/* App Type */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <Label className="text-sm font-semibold mb-3 block">App Type</Label>
              <div className="flex flex-wrap gap-2">
                {currentAppTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedAppType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedAppType === type ? 'bg-primary text-primary-foreground border-primary' : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground bg-background/40'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* UI/UX specific */}
            {mode === 'uiux' && (
              <>
                <div className="bg-card border border-border/50 rounded-2xl p-4">
                  <Label className="text-sm font-semibold mb-3 block">Design Tool</Label>
                  <div className="flex flex-wrap gap-2">
                    {UIUX_TOOLS.map(tool => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setUiuxTool(tool.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${uiuxTool === tool.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {tool.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-4">
                  <Label className="text-sm font-semibold mb-3 block">Style Vibe</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_VIBES.map(s => (
                      <button key={s} onClick={() => setStyleVibe(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${styleVibe === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-4">
                  <Label className="text-sm font-semibold mb-3 block">Screens to Design</Label>
                  <div className="flex flex-wrap gap-2">
                    {SCREEN_TYPES.map(s => (
                      <button key={s} onClick={() => toggleScreen(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedScreens.includes(s) ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tech Stack — for non-uiux modes */}
            {mode !== 'uiux' && currentTechStacks.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <Label className="text-sm font-semibold mb-3 block">Tech Stack</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentTechStacks.map(stack => (
                    <button
                      key={stack.id}
                      onClick={() => setSelectedTechStack(stack.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${selectedTechStack === stack.id ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}
                    >
                      {stack.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Features — for non-uiux/game modes */}
            {!['uiux', 'game'].includes(mode) && (
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <Label className="text-sm font-semibold mb-3 block">Features to Include</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEATURES.map(feat => {
                    const Icon = feat.icon;
                    const active = selectedFeatures.includes(feat.id);
                    return (
                      <button
                        key={feat.id}
                        onClick={() => toggleFeature(feat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${active ? 'bg-green-500/15 text-green-300 border-green-500/40' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}
                      >
                        <Icon className="w-3 h-3 shrink-0" /> {feat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deploy Target */}
            {currentDeployTargets.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <Label className="text-sm font-semibold mb-3 block">Deployment Target</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentDeployTargets.map(dep => {
                    const Icon = dep.icon;
                    return (
                      <button
                        key={dep.id}
                        onClick={() => setSelectedDeploy(dep.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedDeploy === dep.id ? 'bg-orange-500/15 text-orange-300 border-orange-500/40' : 'border-border/40 text-muted-foreground hover:border-border bg-background/40'}`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" /> {dep.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra fields */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Target Users (optional)</Label>
                <Input value={targetUsers} onChange={e => setTargetUsers(e.target.value)}
                  placeholder="e.g. freelancers, students aged 18-25, small business owners"
                  className="bg-background/50 border-border/40 text-sm" />
              </div>
              {mode === 'uiux' && (
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Color Palette (optional)</Label>
                  <Input value={colorPalette} onChange={e => setColorPalette(e.target.value)}
                    placeholder="e.g. Deep purple #6366F1, Dark background #0F0F0F, White text"
                    className="bg-background/50 border-border/40 text-sm" />
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Additional Requirements (optional)</Label>
                <Textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)}
                  placeholder="Any specific features, requirements, or constraints..."
                  className="bg-background/50 border-border/40 text-sm resize-none" rows={2} />
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedAppType}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-sm"
            >
              {isGenerating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Prompt</>}
            </Button>
          </div>

          {/* Right panel — output */}
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Generated Prompt
                </h3>
                {generatedPrompt && (
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reset</button>
                )}
              </div>

              {!generatedPrompt ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                    <Wand2 className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">Select options and click Generate to create your prompt</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {selectedAppType && <Badge variant="secondary" className="text-[10px]">{selectedAppType}</Badge>}
                    {selectedFeatures.slice(0, 3).map(f => <Badge key={f} variant="outline" className="text-[10px]">{FEATURES.find(feat => feat.id === f)?.label}</Badge>)}
                    {selectedFeatures.length > 3 && <Badge variant="outline" className="text-[10px]">+{selectedFeatures.length - 3} more</Badge>}
                  </div>
                  <div className="flex-1 bg-background/50 rounded-xl border border-border/40 p-3 overflow-y-auto max-h-72">
                    <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed">{generatedPrompt}</pre>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleCopy} variant="outline" className="border-border/50 h-9 text-xs">
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</>}
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="border-border/50 h-9 text-xs">
                      <Download className="w-3.5 h-3.5 mr-1.5" />Download
                    </Button>
                  </div>
                  <Button onClick={() => setLocation('/')} className="w-full h-9 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs">
                    <Code2 className="w-3.5 h-3.5 mr-1.5" />Use in AI Chat →
                  </Button>
                </>
              )}
            </div>

            {/* Tips */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Tips
              </h3>
              <div className="space-y-2">
                {[
                  { step: '01', text: 'Select your build type and app category' },
                  { step: '02', text: 'Pick features you need' },
                  { step: '03', text: 'Choose deployment target' },
                  { step: '04', text: 'Copy prompt and paste in AI Chat' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="text-xs font-mono text-primary/60 mt-0.5 shrink-0">{item.step}</span>
                    <span className="text-xs text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick modes */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" /> Quick Build Presets
              </h3>
              <div className="space-y-2">
                {[
                  { label: '🚀 Play Store Android App', action: () => { handleModeChange('mobile'); setSelectedAppType('Social Networking App'); setSelectedTechStack('react-native-expo'); setSelectedDeploy('playstore'); setSelectedFeatures(['auth','push-notif','realtime','chat']); }},
                  { label: '💼 Full Stack SaaS Platform', action: () => { handleModeChange('fullstack'); setSelectedAppType('SaaS Tool'); setSelectedTechStack('nextjs'); setSelectedDeploy('vercel'); setSelectedFeatures(['auth','payments','roles','analytics','email','dark-mode']); }},
                  { label: '🛒 E-Commerce Store', action: () => { handleModeChange('ecommerce'); setSelectedAppType('Fashion & Clothing Store'); setSelectedFeatures(['auth','payments','search','email','analytics','file-upload']); setSelectedDeploy('vercel'); }},
                  { label: '🤖 AI Chatbot App', action: () => { handleModeChange('ai'); setSelectedAppType('AI Chatbot'); setSelectedTechStack('react-openai'); setSelectedFeatures(['auth','realtime','dark-mode','file-upload']); }},
                  { label: '📊 Admin Dashboard', action: () => { handleModeChange('dashboard'); setSelectedAppType('Analytics Dashboard'); setSelectedTechStack('react-node'); setSelectedFeatures(['auth','analytics','roles','email','api','dark-mode']); }},
                  { label: '🎮 Browser Game', action: () => { handleModeChange('game'); setSelectedAppType('Endless Runner'); setSelectedTechStack('js-canvas'); }},
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent hover:border-border/40 transition-all">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
