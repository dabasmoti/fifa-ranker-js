# FIFA Ranker - Database Setup

## 🚀 Migration to Neon Database

This project has been migrated from Vercel Blob storage to Neon PostgreSQL database for better reliability and performance.

## 📋 Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Neon Database Connection (Recommended for most uses)
DATABASE_URL=postgres://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Individual Parameters
PGHOST=ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech
PGHOST_UNPOOLED=ep-frosty-hill-adbfflc6.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_bGWfj4JBEV8k

# Vercel Postgres Template Variables
POSTGRES_URL=postgres://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_bGWfj4JBEV8k
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_bGWfj4JBEV8k@ep-frosty-hill-adbfflc6-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=36ea559a-0db8-4269-b688-ca085b27f9bf
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_gbtwz14wp5n0g8s9hezf7phn6vc4wny7w63dw4bjytcq8
STACK_SECRET_SERVER_KEY=ssk_vvjnva45vcyef2ze4fxbwwsv0245z8jb078shskxqqkpg
```

### 2. Initialize Database

Run the database setup script to create the required tables:

```bash
node scripts/setup-database.js
```

This will create:
- `players` table with id, name, and created_date
- `leagues` table with id, name, description, is_active, and created_date
- `matches` table with all match data and foreign key to leagues
- Appropriate indexes for performance
- A default league if none exists

### 3. Start Development Server

```bash
vercel dev --port 3000
```

## 🔄 Data Migration

The new Sync Management page will help you migrate data from localStorage to the database:

1. Navigate to **Sync Management** in the app sidebar
2. The system will detect if you have localStorage data that needs migration
3. Follow the recommendations to migrate your data safely
4. All operations include automatic backups

## 🏗️ Database Schema

### Players Table
```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Leagues Table
```sql
CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Matches Table
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
  team1_player1 VARCHAR(255) NOT NULL,
  team1_player2 VARCHAR(255),
  team2_player1 VARCHAR(255) NOT NULL,
  team2_player2 VARCHAR(255),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  match_date DATE NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ Troubleshooting

### Database Connection Issues
1. Verify `.env.local` file exists and contains correct credentials
2. Check that Vercel dev server is running (`vercel dev`)
3. Ensure Neon database is accessible from your location

### Migration Issues
1. Use the Sync Management page to check data status
2. Create backups before any migration operations
3. Check browser console for detailed error messages

## 📊 Benefits of Database Migration

- ✅ **Reliability**: No more CORS issues or blob storage limitations
- ✅ **Performance**: Direct SQL queries for faster data access
- ✅ **Scalability**: PostgreSQL handles large datasets efficiently
- ✅ **Data Integrity**: Foreign key constraints and proper relationships
- ✅ **Backup & Recovery**: Built-in database backup capabilities
- ✅ **Concurrent Access**: Multiple users can access data simultaneously

## 🔧 API Endpoints

The database operations are handled through `/api/database` with actions:

- `ping` - Test database connection
- `players.list` - Get all players
- `players.create` - Create new player
- `players.update` - Update player
- `players.delete` - Delete player
- `leagues.list` - Get all leagues
- `leagues.create` - Create new league
- `leagues.getActive` - Get active league
- `leagues.setActive` - Set active league
- `matches.list` - Get matches (with filtering)
- `matches.create` - Create new match
- `matches.update` - Update match
- `matches.delete` - Delete match 