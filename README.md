# 🏆 FIFA Ranker

A modern web application for tracking FIFA player performance and managing 2v2 match results. Built with React, Vite, and Tailwind CSS.

## ✨ Features

- **Player Management**: Add and remove players from your FIFA tournament
- **Match Recording**: Record 2v2 match results with team selection and scores
- **Rankings System**: Automatic calculation of player success percentages based on match results
- **Match Management**: View, edit, and delete all recorded matches
- **Advanced Filtering**: Search matches by player name and filter by result type
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Local Storage**: All data is stored locally in your browser

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

### 1. Add Players
- Navigate to **"Players"** in the sidebar
- Click **"Add Player"** and enter player names
- You need at least 4 players to start recording matches

### 2. Record Matches
- Go to **"Add Match"** in the sidebar  
- Select 2 players for Team 1 and 2 players for Team 2
- Enter the final scores for both teams
- Set the match date (defaults to today)
- Click **"Record Match"**

### 3. View Rankings
- Check **"Rankings"** to see player performance
- Players are ranked by success percentage
- View detailed stats including wins, draws, losses, and points

### 4. Manage Matches
- Visit **"Matches"** to see all recorded games
- **Edit**: Click the blue pencil icon to modify match details
- **Delete**: Click the red trash icon to remove matches
- **Filter**: Search by player name or filter by result type
- **Sort**: Order matches by date created or match date

## 🛠️ Technology Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Date Handling**: date-fns
- **Data Storage**: localStorage (browser)

## 📁 Project Structure

```
fifa-ranker-js/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (Button, Card, etc.)
│   │   ├── matches/        # Match-related components
│   │   └── rankings/       # Ranking display components
│   ├── entities/           # Data models and localStorage logic
│   ├── pages/              # Main application pages
│   ├── utils/              # Utility functions
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
- Data persists in your browser's local storage

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder, ready for deployment to any static hosting service.

### Deploy Options

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Push to a `gh-pages` branch
- **Any static hosting**: Upload the `dist/` folder contents

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Bug Reports & Feature Requests

If you encounter any bugs or have feature requests, please create an issue on the GitHub repository.

## 🎯 Future Enhancements

- [ ] Player statistics graphs and charts
- [ ] Tournament bracket management
- [ ] Export data to CSV/JSON
- [ ] Player avatars and profiles
- [ ] Match history timeline
- [ ] Advanced analytics and insights
- [ ] Team formation suggestions
- [ ] Multi-language support

---

**Enjoy tracking your FIFA matches!** 🎮⚽ 