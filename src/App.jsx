import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/Layout.jsx';

import Players from '@/pages/Players.jsx';
import AddMatch from '@/pages/AddMatch.jsx';
import Matches from '@/pages/Matches.jsx';
import Rankings from '@/pages/Ranking.jsx';
import Seasons from '@/pages/Seasons.jsx';
import { createPageUrl } from '@/utils/createPageUrl.js';

// Simple test components that we know work

function App() {
  console.log('App without GitHub Settings');
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={createPageUrl('Rankings')} replace />} />
        <Route path={createPageUrl('Rankings')} element={<Rankings />} />
        <Route path={createPageUrl('Players')} element={<Players />} />
        <Route path={createPageUrl('Seasons')} element={<Seasons />} />
        <Route path={createPageUrl('Matches')} element={<Matches />} />
        <Route path={createPageUrl('AddMatch')} element={<AddMatch />} />
      </Routes>
    </Layout>
  );
}

export default App; 