# FIFA Ranker Data


A modern web application for tracking FIFA player performance and managing 2v2 match results with league/season organization. Built with React, Vite, and Tailwind CSS.

## ✨ Features

### Core Functionality
- **Player Management**: Add, edit, and remove players from your FIFA tournaments
- **Match Recording**: Record 2v2 match results with team selection and scores
- **Rankings System**: Automatic calculation of player success percentages based on match results
- **Match Management**: View, edit, and delete all recorded matches with advanced filtering

### League & Season Management 🆕
- **League System**: Organize matches into leagues/seasons with start and end dates
- **Multiple Leagues**: Create and manage multiple tournaments or time periods
- **League Statistics**: Track performance metrics per league
- **Historical Data**: View past league results and compare across seasons

### Data Management 🆕
- **CSV Export/Import**: Export your data to CSV files for backup and sharing
- **Data Migration**: Seamless migration from older localStorage-based data
- **Backup System**: Automatic backups with restore capabilities
- **Cross-Platform**: Export data to use across different devices

### Advanced Features
- **Advanced Filtering**: Search matches by player name and filter by result type
- **League-Specific Rankings**: View rankings for specific leagues or all-time stats
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Data Persistence**: All data is stored in CSV format in localStorage with backup options

## 🎯 Scoring System

- **Win**: 3 points
- **Draw**: 1 point  
- **Loss**: 0 points

Success percentage is calculated as: `(Total Points / Max Possible Points) × 100`

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd fifa-ranker-js
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 📱 How to Use

### 1. League Management (New!)
- Navigate to **"Leagues"** in the sidebar
- Create your first league with a name, description, and date range
- Activate a league to start recording matches in it
- End leagues when tournaments conclude
- View statistics and export data for each league

### 2. Add Players
- Navigate to **"Players"** in the sidebar
- Click **"Add Player"** and enter player names
- You need at least 4 players to start recording matches

### 3. Record Matches
- Go to **"Add Match"** in the sidebar  
- Select 2 players for Team 1 and 2 players for Team 2
- Enter the final scores for both teams
- Set the match date (defaults to today)
- Matches are automatically assigned to the active league
- Click **"Record Match"**

### 4. View Rankings
- Check **"Rankings"** to see player performance
- Select a specific league or view all-time rankings
- Players are ranked by success percentage
- View detailed stats including wins, draws, losses, goals, and points

### 5. Manage Matches
- Visit **"Matches"** to see all recorded games
- **Edit**: Click the blue pencil icon to modify match details
- **Delete**: Click the red trash icon to remove matches
- **Filter**: Search by player name or filter by result type
- **Sort**: Order matches by date created or match date

### 6. Data Management (New!)
- **Export**: Download your data as CSV files from any page
- **Import**: Upload CSV files to restore or merge data
- **Migration**: Automatic prompt to migrate from old data format
- **Backup**: All data is automatically backed up with timestamps

## 🛠️ Technology Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Date Handling**: date-fns
- **Data Storage**: CSV format in localStorage with export capabilities

## 📁 Project Structure

```
fifa-ranker-js/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (Button, Card, etc.)
│   │   ├── matches/        # Match-related components
│   │   └── rankings/       # Ranking display components
│   ├── entities/           # Data models and CSV logic
│   │   ├── Player.js       # Player management with stats
│   │   ├── Match.js        # Match management with league support
│   │   └── League.js       # League/season management
│   ├── services/           # Business logic services
│   │   └── CsvService.js   # CSV import/export functionality
│   ├── utils/              # Utility functions
│   │   └── migration.js    # Data migration utilities
│   ├── pages/              # Main application pages
│   │   ├── Rankings.jsx    # Player rankings with league selection
│   │   ├── Players.jsx     # Player management
│   │   ├── Matches.jsx     # Match history and management
│   │   ├── AddMatch.jsx    # Match recording form
│   │   └── Leagues.jsx     # League management (New!)
│   ├── App.jsx             # Main app component
│   ├── Layout.jsx          # App layout with sidebar
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

## 🎮 Game Rules

- Each match is **2v2** (4 players total)
- Every player must be unique per match
- Scores must be **0 or higher**
- Rankings automatically update after each match
- Data persists in CSV format with automatic backups
- Leagues organize matches into seasons or tournaments

## 💾 Data Management

### CSV Format
The app uses CSV files for data storage, making it easy to:
- **Backup**: Download CSV files for safe keeping
- **Share**: Send league data to other organizers
- **Analyze**: Import into Excel, Google Sheets, or other tools
- **Migrate**: Move data between devices or installations

### File Structure
- `players.csv`: Player information and metadata
- `matches.csv`: Match results with league associations
- `leagues.csv`: League/season definitions and settings

### Migration
If you have data from an older version:
1. The app will automatically detect old data
2. Click "Migrate Data" when prompted
3. Your data will be converted to the new format
4. Original data is backed up automatically

## 🚀 Deployment

### For Free Hosting (Recommended for lightweight apps)

#### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Vercel will auto-detect Vite and deploy
4. Your app will be live with a custom URL

#### Netlify
1. Push your code to GitHub
2. Connect your repo to [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy automatically

#### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts: `"deploy": "gh-pages -d dist"`
3. Set base in vite.config.js: `base: '/fifa-ranker-js/'`
4. Run: `npm run build && npm run deploy`

### For Cloud Hosting

#### Google Cloud Run
1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:18 as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. Build and deploy:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/fifa-ranker
   gcloud run deploy --image gcr.io/[PROJECT-ID]/fifa-ranker --platform managed
   ```

### Data Considerations for Deployment
Since the app uses localStorage with CSV format:
- **Data is stored locally** in each user's browser
- **Export data regularly** for backup
- **Consider cloud storage integration** for shared league management
- **Use import/export features** to sync across devices

## 🔧 Configuration

### Environment Variables
Create a `.env` file for customization:
```env
VITE_APP_NAME="Your FIFA League"
VITE_DEFAULT_LEAGUE_NAME="My Tournament"
```

### Customization
- Modify `tailwind.config.js` for theme changes
- Update team logos in `public/` directory
- Customize scoring rules in `src/entities/Player.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature-name'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Test new features with sample data
- Update documentation for new features
- Ensure CSV export/import works with changes
- Test league functionality thoroughly

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Ensure you have the latest version
3. Try exporting and re-importing your data
4. Create an issue on GitHub with details

## 🗺️ Roadmap

Upcoming features:
- [ ] Cloud synchronization options
- [ ] Tournament bracket generation
- [ ] Player photos and profiles
- [ ] Advanced statistics and charts
- [ ] Team management features
- [ ] Mobile app versions

---

**Built with ❤️ for FIFA tournament organizers** 
=======
This repository stores FIFA tournament data.
Generated by FIFA Ranker application.
\
