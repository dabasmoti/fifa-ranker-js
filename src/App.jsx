import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/Layout.jsx';
import Rankings from '@/pages/Ranking.jsx';
import Players from '@/pages/Players.jsx';
import Matches from '@/pages/Matches.jsx';
import AddMatch from '@/pages/AddMatch.jsx';
import { createPageUrl } from '@/utils/createPageUrl.js';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={createPageUrl('Rankings')} replace />} />
        <Route path={createPageUrl('Rankings')} element={<Rankings />} />
        <Route path={createPageUrl('Players')} element={<Players />} />
        <Route path={createPageUrl('Matches')} element={<Matches />} />
        <Route path={createPageUrl('AddMatch')} element={<AddMatch />} />
      </Routes>
    </Layout>
  );
}

export default App; 