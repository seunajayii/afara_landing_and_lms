# AFÁRÁ Accelerator Platform

AFÁRÁ is a business accelerator platform supporting female-owned and led African companies in the Energy and Infrastructure space. The name "AFÁRÁ" comes from the Yoruba word meaning "bridge"—symbolizing connection, transition, and opportunity.

## Features

- **Public Website**: Showcases the accelerator program, mission, and application process
- **Application System**: Multi-step application form with save progress and video essay support
- **Learning Management System (LMS)**: Training modules, mentorship tracking, and resource library
- **Newsletter System**: Email subscriptions and campaign management via Resend
- **User Management**: Role-based access (superadmin, admin, facilitator, mentor, participant)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Resend

---

## Deployment on Railway

### Prerequisites

1. A [Railway](https://railway.app) account (paid plan required for web services)
2. A [Cloudflare](https://cloudflare.com) account for R2 storage
3. A [Resend](https://resend.com) account for email

### Step 1: Create Cloudflare R2 Bucket

1. Go to Cloudflare Dashboard → R2 Object Storage
2. Click "Create bucket" and name it (e.g., `afara-storage`)
3. Go to "Manage R2 API Tokens" → "Create API token"
4. Select "Object Read & Write" permissions
5. Save the Access Key ID and Secret Access Key

### Step 2: Deploy to Railway

1. Push your code to GitHub
2. Go to [Railway Dashboard](https://railway.app/dashboard)
3. Click "New" → "Deploy from GitHub repo"
4. Select your repository
5. Wait for the initial deployment (it will fail - that's expected)

### Step 3: Add PostgreSQL Database

1. In your Railway project, click "Create" → "Database" → "PostgreSQL"
2. Wait for the database to provision

### Step 4: Configure Environment Variables

In Railway, click on your service → "Variables" tab and add:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Click "Add Reference" → Select your PostgreSQL database |
| `SESSION_SECRET` | A random string (generate with `openssl rand -hex 32`) |
| `RESEND_API_KEY` | Your Resend API key for emails |
| `R2_ACCOUNT_ID` | Your Cloudflare account ID (found in R2 dashboard URL) |
| `R2_ACCESS_KEY_ID` | R2 API token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token Secret Access Key |
| `R2_BUCKET_NAME` | Your R2 bucket name (e.g., `afara-storage`) |
| `R2_PUBLIC_URL` | (Optional) Custom domain for public files |
| `NODE_ENV` | `production` |

### Step 5: Generate Domain

1. Go to your service → "Settings" → "Networking"
2. Click "Generate Domain" to get a public URL

### Step 6: Run Database Migrations

After deployment, run migrations via Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:push
```

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/afara
   SESSION_SECRET=your-dev-secret
   RESEND_API_KEY=your-resend-key
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Server port (default: 5000) |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `R2_ACCOUNT_ID` | Production | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Production | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | Production | R2 API secret key |
| `R2_BUCKET_NAME` | Production | R2 bucket name |
| `R2_PUBLIC_URL` | No | Public URL for R2 files |

---

## Default Admin Account

On first run, the system creates a superadmin account:

- **Email**: admin@afara.africa
- **Password**: AfaraAdmin2024!

**Important**: Change this password immediately after first login.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push database schema changes |

---

## License

MIT

---

## About

AFÁRÁ is an initiative of [Open Spaces & Bridges Advisory (OPSB)](https://opsb.africa).
