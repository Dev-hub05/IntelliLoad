import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import { Settings, FolderGit2, Flame, Layers, BarChart3 } from 'lucide-react';
import './App.css';

import Dashboard from './components/Dashboard/Dashboard';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';

// Placeholder Pages (Real components will replace these in subsequent days)
const CollectionsPlaceholder = () => (
  <div className="mock-page">
    <div className="glass-panel mock-card animate-fade-in">
      <FolderGit2 size={48} className="mock-icon" />
      <h2>API Collections</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Chained request pipelines and extraction rules. (Phase 5)</p>
    </div>
  </div>
);

const AutonomousPlaceholder = () => (
  <div className="mock-page">
    <div className="glass-panel mock-card animate-fade-in">
      <Flame size={48} className="mock-icon" />
      <h2>Autonomous Stress Testing</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Automated progressive load ramping and failure discovery. (Phase 5)</p>
    </div>
  </div>
);

const ComparePlaceholder = () => (
  <div className="mock-page">
    <div className="glass-panel mock-card animate-fade-in">
      <Layers size={48} className="mock-icon" />
      <h2>Compare Runs</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Side-by-side performance comparison metrics. (Phase 5)</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/configure" element={<ConfigPanel />} />
            <Route path="/collections" element={<CollectionsPlaceholder />} />
            <Route path="/autonomous" element={<AutonomousPlaceholder />} />
            <Route path="/compare" element={<ComparePlaceholder />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
