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

function buildFullStackPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.fullstack.find(s => s.id === opts.techStack) || TECH_STACKS.fullstack[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);
  const deployLabel = DEPLOY_TARGETS.fullstack.find(d => d.id === opts.deployTarget)?.label || 'Render';

  return `Build a complete, production-ready full stack web application called "${opts.appName || 'MyApp'}" — a ${opts.appType || 'web platform'}.

## Requirements

**Tech Stack:** ${stackLabel}
**Deployment Target:** ${deployLabel}

## Features to Build (ALL must be fully implemented — no stubs):
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
• Full CRUD operations for all core entities
• Responsive design (mobile + tablet + desktop)
• Form validation (client-side + server-side)
• Error handling and loading states throughout
• Environment configuration (.env.example)
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Code Standards:
- Minimum 1000 lines of code total
- Every function fully implemented — no TODO comments, no placeholder code
- Real database queries (not hardcoded data)
- Proper HTTP status codes and error responses
- Password hashing with bcrypt
- JWT tokens with refresh logic
- Rate limiting and security headers
- Pagination for all list endpoints

## File Structure Required:
frontend/
  src/pages/ — every page component fully built
  src/components/ — reusable components
  src/hooks/ — custom React hooks
  src/api/ — API client functions
  src/types/ — TypeScript types

backend/
  src/routes/ — all API route handlers
  src/middleware/ — auth, rate-limit, error handlers
  src/controllers/ — business logic
  src/models/ — database models/schema
  src/utils/ — helper functions
  server.ts — entry point

database/
  schema.sql or prisma/schema.prisma — complete schema
  seed.ts — seed data

config/
  .env.example
  docker-compose.yml (optional)

## Output Format:
Show every file completely. No truncation. Label each file as:
=== path/filename.ext ===

End with:
### Quick Start Guide (step-by-step commands)
### Deploy to ${deployLabel} (complete deployment steps)`;
}

function buildMobilePrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.mobile.find(s => s.id === opts.techStack) || TECH_STACKS.mobile[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);
  const deployTarget = opts.deployTarget || 'both';
  const storeInfo = deployTarget === 'playstore' ? 'Google Play Store' : deployTarget === 'appstore' ? 'Apple App Store' : 'Both Google Play Store and Apple App Store';

  return `Build a complete, production-ready mobile application called "${opts.appName || 'MyApp'}" — a ${opts.appType || 'mobile app'} — ready for submission to ${storeInfo}.

## Tech Stack: ${stackLabel}

## App Screens (ALL fully built — not skeleton, not placeholder):
• Splash Screen with app logo and animation
• Onboarding (3-slide walkthrough for new users)
• Login Screen (email + password, show/hide password)
• Register Screen (full form with validation)
• Forgot Password Screen
• Home / Main Screen (fully functional with real content)
• Profile Screen (view and edit user info)
• Settings Screen (notifications, theme, account options)
• [All domain-specific screens for a ${opts.appType}]

## Features to Implement:
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
• Bottom tab navigation with icons
• Stack navigation (React Navigation)
• AsyncStorage for local data persistence
• Loading spinners and error states on every screen
• Pull-to-refresh on list screens
• Proper keyboard handling (KeyboardAvoidingView)
• Safe area handling (SafeAreaView)
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Backend API (include this too):
• Node.js + Express REST API
• JWT authentication
• PostgreSQL database with complete schema
• All endpoints the app needs

## App Configuration (app.json):
• App name, slug, bundle identifier (com.${(opts.appName || 'myapp').toLowerCase().replace(/\s/g,'')}${opts.appType ? '.' + opts.appType.toLowerCase().replace(/\s/g,'') : ''})
• Android: versionCode, permissions (camera, notifications, location if needed)
• iOS: bundleIdentifier, permissions with usage descriptions
• App icon and splash screen config
• EAS build configuration (eas.json)

## Output Format:
Show every file completely. No truncation. Label each file as:
=== path/filename.ext ===

End with:
### Quick Start (commands to run on local device/emulator)
### 🚀 Publish to ${storeInfo}:
  Step-by-step guide from build to store submission including:
  - EAS Build commands
  - Store listing requirements (screenshots, descriptions, ratings)
  - Submission process and review timelines`;
}

function buildBackendPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.backend.find(s => s.id === opts.techStack) || TECH_STACKS.backend[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready REST API server called "${opts.appName || 'MyAPI'}" — a ${opts.appType || 'backend service'}.

## Tech Stack: ${stackLabel}

## API Requirements (ALL endpoints fully implemented):
• Authentication routes: POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/refresh
• Full CRUD for all core resources
• Proper request validation (Joi/Zod)
• OpenAPI/Swagger documentation
• Health check endpoint: GET /health
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Security & Quality:
• Helmet.js for security headers
• CORS configuration
• Rate limiting (express-rate-limit)
• Input sanitization
• SQL injection prevention (parameterized queries)
• Proper error middleware (dev vs prod error messages)
• Request logging (Morgan)
• Graceful shutdown

## Database:
• Complete schema with all tables, relationships, indexes
• Migration files
• Seed data for testing
• Connection pooling

## File Structure:
src/
  routes/ — all route files
  controllers/ — business logic
  middleware/ — auth, validation, error, rate-limit
  models/ — DB models/queries
  services/ — external service integrations
  utils/ — helpers
  config/ — database, app config
  types/ — TypeScript types
server.ts, .env.example, docker-compose.yml, README.md

## Output Format:
Show every file completely. Label each: === path/filename.ext ===
End with API documentation table showing all endpoints.`;
}

function buildEcommercePrompt(opts: any): string {
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready e-commerce platform called "${opts.appName || 'MyShop'}" — ${opts.appType || 'an online store'} with real payment processing.

## Tech Stack: React + Node.js + PostgreSQL + Stripe

## Frontend Pages (ALL fully built):
• Home page with hero, featured products, categories
• Product listing with filters, search, sorting, pagination
• Product detail with images, reviews, add-to-cart
• Shopping cart with quantity controls
• Checkout flow (shipping → payment → confirmation)
• User account (orders history, profile, addresses)
• Login / Register pages
• Admin dashboard (products, orders, customers, analytics)

## Backend API (fully implemented):
• Products CRUD (with images, variants, inventory)
• Categories and tags
• Cart management (server-side)
• Orders management with status tracking
• Stripe payment integration (checkout sessions, webhooks)
• User authentication with JWT
• Admin endpoints (protected)
• Inventory tracking
• Coupon/discount codes
• Email order confirmations

## Features:
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
• Product search with filters
• Product reviews and ratings
• Wishlist
• Related products
• Order tracking
• Inventory management
• Sales analytics
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Output Format:
Show every file completely. Label each: === path/filename.ext ===
End with: Quick Start + Stripe setup guide + Deployment steps.`;
}

function buildGamePrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.game.find(s => s.id === opts.techStack) || TECH_STACKS.game[0]).label;

  return `Build a complete, fully playable ${opts.appType || 'browser game'} called "${opts.appName || 'MyGame'}" using ${stackLabel}.

## Game Requirements:
• Complete game loop (start → play → game over → restart)
• Main menu screen with play button and instructions
• Game over screen with score and high score
• Smooth animations at 60fps
• Sound effects (using Web Audio API or Howler.js)
• Mobile-responsive controls (touch + keyboard)
• Local high score storage (localStorage)
• Pause/resume functionality

## Game Mechanics (ALL fully implemented for ${opts.appType}):
• Complete game physics and collision detection
• Scoring system with multipliers
• Difficulty progression (increases over time)
• Power-ups or special mechanics
• Visual effects (particles, animations)

## UI/UX:
• Beautiful start screen with animated background
• HUD showing score, lives, level
• Responsive design (plays on mobile and desktop)
• Theme and visual identity for the game
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Output Format:
Show every file completely. Label each: === filename.ext ===
End with: How to play + controls guide + How to deploy/host.`;
}

function buildAIPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.ai.find(s => s.id === opts.techStack) || TECH_STACKS.ai[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready AI-powered application called "${opts.appName || 'MyAI'}" — ${opts.appType || 'an AI tool'} using ${stackLabel}.

## Frontend (fully built):
• Clean, modern chat/input interface
• Streaming AI responses (typewriter effect)
• Conversation history
• Loading states and error handling
• Copy response button
• Model/temperature selector (if applicable)
• Dark mode
• Responsive design

## Backend API:
• AI API integration (streaming responses)
• Conversation management and history storage
• Rate limiting per user
• API key management
• Usage tracking

## Features:
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
• Prompt templates/suggestions
• Export conversation as PDF/text
• Share conversation link
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## AI Integration:
• Streaming SSE responses
• System prompt customization
• Context window management (summarize old messages)
• Fallback error handling for API failures
• Token usage display

## Output Format:
Show every file completely. Label each: === path/filename.ext ===
End with: Setup (API key config) + Deployment guide.`;
}

function buildDashboardPrompt(opts: any): string {
  const stackLabel = (TECH_STACKS.dashboard.find(s => s.id === opts.techStack) || TECH_STACKS.dashboard[0]).label;
  const featureLabels = opts.features.map((f: string) => FEATURES.find(feat => feat.id === f)?.label).filter(Boolean);

  return `Build a complete, production-ready ${opts.appType || 'admin dashboard'} called "${opts.appName || 'MyDashboard'}" using ${stackLabel}.

## Dashboard Pages (ALL fully built):
• Login page with auth
• Main Dashboard — KPI cards, charts, recent activity
• Data table pages with sorting, filtering, pagination, export
• Detail/edit pages for each data type
• Settings page (account, notifications, integrations)
• User management (if multi-user)
• Reports / Analytics page with charts
• Profile page

## Charts & Visualizations:
• Line charts (trends over time)
• Bar charts (comparisons)
• Pie/donut charts (distributions)
• Area charts (cumulative data)
• Data tables with bulk actions
• Real numbers from the database (not fake)

## Backend API:
• Authentication with role-based access (admin, viewer, editor)
• All data endpoints with filtering, sorting, pagination
• CSV export endpoints
• Dashboard metrics aggregation queries
• Activity logging

## Features:
${featureLabels.map((f: string) => `• ${f}`).join('\n')}
• Date range picker for filtering
• Real-time updates (WebSocket or polling)
• Bulk operations on table data
• Audit log
• Email notifications for alerts
${opts.extraNotes ? `• ${opts.extraNotes}` : ''}

## Output Format:
Show every file completely. Label each: === path/filename.ext ===
End with: Setup guide + Deployment steps.`;
}

function buildUIUXPrompt(opts: any): string {
  const toolLabel = UIUX_TOOLS.find(t => t.id === opts.uiuxTool)?.label || opts.uiuxTool;
  const screenList = opts.selectedScreens.length > 0 ? opts.selectedScreens.join(', ') : 'all key screens';
  return `Design a complete, production-ready ${toolLabel} UI/UX design for a ${opts.appType || 'modern app'} called "${opts.appName || 'MyApp'}".

**Design Style:** ${opts.styleVibe || 'Modern & Clean'}
${opts.targetUsers ? `**Target Users:** ${opts.targetUsers}` : ''}
${opts.colorPalette ? `**Color Palette:** ${opts.colorPalette}` : ''}

**Screens to Design:** ${screenList}

**Design Requirements:**
- Create a visually stunning, pixel-perfect design with exceptional attention to detail
- Use a consistent design system with reusable components (buttons, cards, inputs, typography scale)
- Apply proper spacing, padding, and visual hierarchy following the 8pt grid system
- Include micro-interactions and hover/tap states for interactive elements
- Ensure accessibility with sufficient color contrast (WCAG AA minimum)
- Design for both light and dark mode variants
- Include responsive breakpoints for mobile (375px), tablet (768px), and desktop (1440px)
- Use modern design trends: subtle gradients, depth with shadows, smooth transitions
- Include iconography that matches the design style
- Add realistic placeholder content (no Lorem Ipsum — use real-sounding names/data)
${opts.extraNotes ? `\n**Additional Notes:** ${opts.extraNotes}` : ''}

**Deliverables:**
- Complete design for all specified screens
- Component library / design system
- Color palette with hex values
- Typography scale (font family, sizes, weights)
- Spacing system
- Icon set recommendations`;
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
                <Zap className="w-4 h-4 text-yellow-400" /> Quick Build
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Play Store Android App', action: () => { handleModeChange('mobile'); setSelectedAppType('Social Networking App'); setSelectedTechStack('react-native-expo'); setSelectedDeploy('playstore'); setSelectedFeatures(['auth','push-notif','realtime']); }},
                  { label: 'Full Stack SaaS', action: () => { handleModeChange('fullstack'); setSelectedAppType('SaaS Tool'); setSelectedTechStack('nextjs'); setSelectedDeploy('vercel'); setSelectedFeatures(['auth','payments','roles','analytics']); }},
                  { label: 'E-Commerce Store', action: () => { handleModeChange('ecommerce'); setSelectedAppType('Fashion & Clothing Store'); setSelectedFeatures(['auth','payments','search','email']); setSelectedDeploy('vercel'); }},
                  { label: 'AI Chatbot App', action: () => { handleModeChange('ai'); setSelectedAppType('AI Chatbot'); setSelectedTechStack('react-openai'); setSelectedFeatures(['auth','realtime','dark-mode']); }},
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent hover:border-border/40 transition-all">
                    <Rocket className="w-3 h-3 inline mr-2 text-violet-400" />{item.label}
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
