import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import { Settings, FolderGit2, Flame, Layers, BarChart3 } from 'lucide-react';
import './App.css';

import Dashboard from './components/Dashboard/Dashboard';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import Collections from './components/Collections/Collections';
import AutonomousStress from './components/TestRunner/AutonomousStress';

import CompareRuns from './components/Results/CompareRuns';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/configure" element={<ConfigPanel />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/autonomous" element={<AutonomousStress />} />
            <Route path="/compare" element={<CompareRuns />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
