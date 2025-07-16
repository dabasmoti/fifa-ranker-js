import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/Layout.jsx';

import Players from '@/pages/Players.jsx';
import AddMatch from '@/pages/AddMatch.jsx';
import Matches from '@/pages/Matches.jsx';
import Rankings from '@/pages/Ranking.jsx';
import SyncManagement from '@/pages/SyncManagement.jsx';
import { createPageUrl } from '@/utils/createPageUrl.js';

// Simple test components that we know work





const TestLeagues = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-indigo-600">Leagues</h1>
    <p className="mt-4 text-gray-600">This page is working!</p>
  </div>
);

function App() {
  console.log('App without GitHub Settings');
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={createPageUrl('Players')} replace />} />
        <Route path={createPageUrl('Rankings')} element={<Rankings />} />
        <Route path={createPageUrl('Players')} element={<Players />} />
        <Route path={createPageUrl('Matches')} element={<Matches />} />
        <Route path={createPageUrl('AddMatch')} element={<AddMatch />} />
        <Route path={createPageUrl('Leagues')} element={<TestLeagues />} />
        <Route path={createPageUrl('Sync')} element={<SyncManagement />} />
      </Routes>
    </Layout>
  );
}

export default App; 