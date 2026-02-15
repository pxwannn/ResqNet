import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from './components/shared/DashboardLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ModelTestingPage } from './features/testing/ModelTestingPage';
import AnalyticsPage from './features/testing/AnalyticsPage';

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Router>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/testing" element={<ModelTestingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
