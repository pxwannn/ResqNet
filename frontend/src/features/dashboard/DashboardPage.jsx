import React from 'react';
import { DashboardContent } from './DashboardContent'; // Import the main content component

/**
 * --- Main Exported Dashboard Page Component ---
 * This component is used by the router (e.g., App.jsx)
 * It renders the DashboardContent which holds the actual dashboard logic and state.
 */
export function DashboardPage() {
  return <DashboardContent />;
}