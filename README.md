# 2026 Personal Tracker

A personal operating system for tracking goals, fitness, and projects. Built with Next.js, Supabase, and OpenAI.

## Features

- **Goal Management**: Create goals and get AI-generated tracking plans
- **Check-ins**: Log weight, steps, calories, coding minutes, and workouts
- **Progress Photos**: Track visual progress with photos over time
- **Weekly Projects**: Manage your vibe-coding projects week by week
- **Meals**: Quick calorie/macros logging with optional photo-based estimates
- **Workout Consistency**: Log workouts and view weekly session counts
- **AI-Powered Insights**: Get weekly reviews and personalized recommendations
- **Mobile-First PWA**: Progressive Web App designed for mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage (private photo storage)
- **Authentication**: Supabase Auth
- **AI**: OpenAI Responses API (GPT-4 Turbo)
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project
- An OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 2026-Sweeney-Goal-Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
```

4. Set up Supabase database:
   - In your Supabase dashboard, go to SQL Editor
   - Run the migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_storage_bucket.sql`
     - `supabase/migrations/003_meals.sql`

   Or use the Supabase CLI:
   ```bash
   # If you have Supabase CLI installed
   supabase db push
   ```

5. Set up Supabase Storage:
   - In Supabase dashboard, go to Storage
   - The migration should have created the `progress-photos` bucket
   - Verify it exists and is set to private

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Sign up for an account at `/auth/login`
2. Create your first goal at `/goals/new`
3. Start logging check-ins at `/check-ins`
4. Generate a weekly review at `/review`

## Project Structure

```
.
├── app/
│   ├── (app)/              # Protected app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── goals/          # Goals management
│   │   ├── check-ins/      # Daily check-ins
│   │   ├── photos/         # Progress photos
│   │   ├── projects/       # Weekly projects
│   │   └── review/         # Weekly AI review
│   ├── api/
│   │   └── ai/             # AI route handlers
│   ├── auth/               # Authentication pages
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── nav.tsx             # Navigation component
│   └── weight-chart.tsx    # Weight chart component
├── lib/
│   ├── supabase/           # Supabase client/server helpers
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── supabase/
│   └── migrations/         # Database migrations
└── public/
    ├── manifest.webmanifest # PWA manifest
    └── icons/              # PWA icons
```

## Database Schema

The app uses the following main tables:

- `profiles`: User profiles with timezone and unit preferences
- `goals`: User goals
- `goal_plans`: AI-generated tracking plans for goals
- `checkins`: Daily check-ins (weight, steps, calories, coding minutes, workouts)
- `photos`: Progress photos with storage paths
- `meals`: Meal logs with macros and optional AI estimates + photos
- `workouts`: Detailed workout logs
- `projects`: Weekly vibe-coding projects

All tables have Row Level Security (RLS) enabled, ensuring users can only access their own data.

## API Routes

### `/api/ai/goal-plan`
Generates an AI-powered tracking plan for a goal.

**Request:**
```json
{
  "goalText": "Lose 20 pounds by June",
  "context": { ... }
}
```

**Response:**
```json
{
  "plan": {
    "lagging_metric": "weight",
    "leading_metrics": ["steps/day", "calories/day"],
    "cadence": "daily",
    "checkin_types": ["number"],
    "minimum_viable_day": "...",
    "weekly_review_prompt": "...",
    "reminder_suggestions": [...]
  }
}
```

### `/api/ai/weekly-review`
Generates a weekly review based on recent tracking data.

**Request:**
```json
{
  "days": 7
}
```

**Response:**
```json
{
  "review": {
    "wins": [...],
    "risks": [...],
    "changes": [...],
    "next_week_plan": [...],
    "priority_goal": "..."
  }
}
```

## PWA Setup

The app is configured as a Progressive Web App:

- Installable on mobile devices
- Works offline (with limitations)
- Icons and manifest configured

To customize:
- Replace icons in `public/icons/` (192x192 and 512x512 PNG files)
- Update `public/manifest.webmanifest` if needed

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_MODEL` | OpenAI model to use (default: gpt-4-turbo-preview) | No |

## Security Notes

- Never expose OpenAI API keys in client-side code (all AI routes are server-side)
- All database queries use Row Level Security (RLS)
- Photos are stored privately in Supabase Storage
- Signed URLs are used for photo access (expire after 1 hour)

## Future Enhancements (P1/P2)

- Meal logging with food database integration
- Photo-to-calorie estimation
- Device sync (iOS HealthKit, Android Health Connect)
- Workout templates
- Social features
- Premium coaching features

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.