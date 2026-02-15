import React from 'react';

export const LeafletCSS = () => (
  <style>{`
    /* Import Leaflet's base CSS */
    @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    
    /* Style the map container */
    .leaflet-container {
      height: 100%;
      width: 100%;
      min-height: 400px;
      border-radius: 1rem;
      z-index: 10;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* Enhanced popup styling */
    .leaflet-popup-content-wrapper {
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      border: 2px solid #3b82f6;
      backdrop-filter: blur(8px);
      background: rgba(255, 255, 255, 0.95);
    }

    .leaflet-popup-content {
      margin: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .leaflet-popup-tip {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    /* Custom marker animations */
    .custom-marker {
      background: transparent !important;
      border: none !important;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .leaflet-popup-content-wrapper {
        border: 3px solid #000;
        background: #fff;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .leaflet-container {
        transition: none;
      }
      
      .custom-marker .animate-pulse,
      .custom-marker .animate-ping {
        animation: none;
        opacity: 1;
      }
    }

    /* Layer control styling */
    .leaflet-control-layers {
      border-radius: 0.75rem !important;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
    }

    .leaflet-control-layers-toggle {
      background-size: 24px 24px !important;
    }

    /* Zoom control styling */
    .leaflet-control-zoom {
      border-radius: 0.75rem !important;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
    }

    .leaflet-control-zoom a {
      border-radius: 0 !important;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    .animate-pulse {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes ping {
      0% { transform: scale(1); opacity: 1; }
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes slideInFromBottom {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-in-bottom {
      animation: slideInFromBottom 0.5s ease-out;
    }

    /* Risk level color classes with high contrast */
    .risk-low { 
      background-color: #dcfce7; 
      color: #166534; 
      border-color: #22c55e;
    }
    .risk-medium { 
      background-color: #fef9c3; 
      color: #854d0e; 
      border-color: #eab308;
    }
    .risk-high { 
      background-color: #fee2e2; 
      color: #991b1b; 
      border-color: #ef4444;
    }
    .risk-unknown { 
      background-color: #f3f4f6; 
      color: #374151; 
      border-color: #9ca3af;
    }

    /* High contrast risk classes */
    .high-contrast .risk-low { 
      background-color: #000; 
      color: #fff; 
      border-color: #0f0;
    }
    .high-contrast .risk-medium { 
      background-color: #000; 
      color: #ff0; 
      border-color: #ff0;
    }
    .high-contrast .risk-high { 
      background-color: #000; 
      color: #f00; 
      border-color: #f00;
    }

    /* Custom scrollbar with accessibility */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
      border: 2px solid #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Enhanced hover effects */
    .hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hover-lift:hover {
      transform: translateY(-8px);
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    }

    .hover-glow:hover {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
    }

    /* Loading skeleton with reduced motion support */
    @keyframes skeleton-loading {
      0% { background-color: #f3f4f6; }
      50% { background-color: #e5e7eb; }
      100% { background-color: #f3f4f6; }
    }
    .skeleton {
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background-color: #e5e7eb;
      }
    }

    /* Focus styles for accessibility */
    .focus-ring:focus {
      outline: 3px solid #3b82f6;
      outline-offset: 2px;
      border-radius: 0.375rem;
    }

    .focus-ring:focus:not(:focus-visible) {
      outline: none;
    }

    /* Skip link for keyboard navigation */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #3b82f6;
      color: white;
      padding: 8px;
      border-radius: 0.375rem;
      text-decoration: none;
      z-index: 100;
      transition: top 0.3s;
    }

    .skip-link:focus {
      top: 6px;
    }

    /* High contrast mode improvements */
    @media (prefers-contrast: high) {
      .leaflet-container {
        border: 2px solid #000;
      }
      
      .focus-ring:focus {
        outline: 3px solid #000;
        outline-offset: 3px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-auto {
        background-color: #1f2937;
        color: #f9fafb;
      }
    }

    /* Alert notification styles */
    .alert-notification {
      border-left: 4px solid;
      animation: slideInRight 0.5s ease-out;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Training spinner */
    .training-spinner {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
  `}</style>
);