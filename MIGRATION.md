# Migration Status - GSV Calendar Web

## 🚀 Overview
Migração do app React Native (Expo) para Next.js 15 Web App (PWA).

## ✅ Completed Features
- [x] **Project Setup**: Next.js 15, TypeScript, TailwindCSS, Shadcn/UI, Supabase.
- [x] **Authentication**: Supabase Auth (Email/Password) + Google OAuth (Calendar scope).
- [x] **Database**: Supabase PostgreSQL schemas (profiles, scales).
- [x] **Scales CRUD**:
    - [x] Create, Read, Update, Delete scales.
    - [x] Infinite scroll / Load more logic (or full fetch for MVP).
    - [x] Filters (Date range, Scale type).
    - [x] **Disable/Cancel Scale**: Logic to mark scale as inactive/canceled with reason.
- [x] **Google Calendar Sync**:
    - [x] 1-way sync (App -> Google Calendar).
    - [x] Connect/Disconnect Google Account.
    - [x] Real-time updates to Google Events when editing in App.
    - [x] "Sync Button" to push local scales to Google.
    - [x] Prevent duplicates logic.
- [x] **CSV Operations**:
    - [x] Import CSV (Parse & Insert).
    - [x] Export CSV (Generate & Download).
- [x] **Reports/Dashboard**:
    - [x] Monthly totals (Hours, Values).
    - [x] Charts (Earnings, Operation Ranking, Location Ranking).
    - [x] Previous period comparison.
    - [x] **Active vs Inactive breakdown**.
- [x] **PWA Features**:
    - [x] Manifest file.
    - [x] Service Worker (next-pwa).
    - [x] Install prompt & Update notification.
    - [x] Mobile-first UI optimizations (Compact cards, Touch targets).

## 🚧 Pending / Improvements
- [x] **Offline Mode**: Supported via localStorage caching + PWA Service Worker.
- [x] **Tests**: Basic E2E auth tests with Playwright.
- [ ] **Accessibility**: Audit ARIA labels and keyboard navigation.
- [ ] **Performance**: Analyze bundle size and optimize images/icons.

## 📝 Notes
- **Supabase**: Ensure RLS policies are active and secure.
- **Google API**: Production deployment requires verifying the Google Cloud Console consent screen if scope is sensitive.
- **Vercel**: Deployment pipeline is active on `main` branch.

---
*Last Updated: 2026-02-02*
