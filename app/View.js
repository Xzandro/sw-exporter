import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import Layout from './pages/Layout';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Help from './pages/Help';

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);
