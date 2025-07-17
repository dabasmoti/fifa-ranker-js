# FIFA Ranker Migration Scripts

This directory contains scripts for setting up and migrating data to your FIFA Ranker database.

## Available Scripts

### 1. Database Setup
```bash
npm run setup-db
```
Sets up the database schema (tables, indexes, etc.). Run this first before any data migration.

### 2. Data Migration
```bash
npm run migrate
```
Imports your existing match data into the database. This is a **one-time script** that will:

- ✅ Parse your CSV match data
- ✅ Create all players automatically (Moti, Uri, Asaf, Chen, Baki, Nir)
- ✅ Create or use an active season for the matches
- ✅ Import all 40 matches with proper timestamps
- ✅ Handle duplicates gracefully

## Prerequisites

Before running the migration:

1. **Environment Variables**: Make sure these are set in your `.env.local`:
   ```
   DATABASE_URL=your-neon-database-url
   POSTGRES_URL=your-postgres-url
   ```

2. **Database Schema**: Run the setup script first:
   ```bash
   npm run setup-db
   ```

## Migration Process

The migration script will:

1. **Check Database Connection** - Verify it can connect to your Neon database
2. **Parse Match Data** - Convert your CSV data into structured format  
3. **Create Players** - Add: Moti, Uri, Asaf, Chen, Baki, Nir (if they don't exist)
4. **Setup Season** - Use existing active season or create "Migration Season 2025"
5. **Import Matches** - Add all 40 matches with proper team compositions and scores

## Expected Output

```
🚀 Starting FIFA Ranker data migration...

🔌 Checking database connection...
✅ Database connected

📝 Parsing match data...
✅ Parsed 40 matches

🔍 Checking and creating players...
✅ Created player: Moti
✅ Created player: Uri
✅ Created player: Asaf
✅ Created player: Chen
✅ Created player: Baki
✅ Created player: Nir

📊 Player Summary:
   • Created: 6 players
   • Existing: 0 players
   • Total: 6 players

🏆 Setting up migration season...
🆕 No active season found, creating migration season...
✅ Created migration season: Migration Season 2025

📥 Importing matches...
   📈 Progress: 10/40 matches imported
   📈 Progress: 20/40 matches imported
   📈 Progress: 30/40 matches imported
   📈 Progress: 40/40 matches imported

📊 Import Summary:
   • Successfully imported: 40 matches
   • Failed: 0 matches

🎉 Migration completed successfully!

📈 Next steps:
   • Visit your app to see the imported data
   • Check the Rankings page to see player statistics
   • Review the Matches page to verify all data imported correctly
```

## Troubleshooting

### Database Connection Issues
- Make sure your Neon database is running
- Verify environment variables are correct
- Check that you have internet connectivity

### Permission Issues
- Ensure your database user has CREATE/INSERT permissions
- Verify the database schema exists (run `npm run setup-db`)

### Duplicate Data
The script is safe to run multiple times:
- Players won't be duplicated (handled gracefully)
- Matches might be duplicated (you may need to clean up manually)

## Data Being Imported

Your migration includes:
- **Players**: 6 unique players (Moti, Uri, Asaf, Chen, Baki, Nir)  
- **Matches**: 40 matches from July 6-16, 2025
- **Date Range**: 2025-07-06 to 2025-07-16
- **Teams**: Various 2v2 combinations
- **Scores**: Complete match results with proper scoring

## After Migration

Once completed, you can:
1. Visit `https://fifa-ranker-js.vercel.app/players` to see all players
2. Check `https://fifa-ranker-js.vercel.app/rankings` for calculated statistics
3. View `https://fifa-ranker-js.vercel.app/matches` to see all imported matches
4. Use `https://fifa-ranker-js.vercel.app/seasons` to manage your seasons

## Need Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your database connection and credentials
3. Ensure the database schema is set up correctly
4. Make sure all environment variables are configured in Vercel 