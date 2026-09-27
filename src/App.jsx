# PharmaCare PK

A lightweight pharmacy management system built with React and Node.js. The app helps you manage medicines, customers, sales, ledger records, and FBR/GST summaries in one dashboard.

## Features

- Medicine inventory tracking
- Customer management
- Sale recording with stock deduction
- Financial ledger
- FBR / GST reporting
- Responsive interface for desktop and tablet screens

## Tech stack

- React + Vite
- Express.js
- In-memory data store for quick demo usage

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app in development mode:
   ```bash
   npm run dev
   ```
3. Open http://localhost:5173

The Express API runs on http://localhost:4000.

## Production build

```bash
npm run build
npm start
```

The built frontend will be served through the Express server.

## Notes

This repository has a simple in-memory database so it can run immediately without external services.

