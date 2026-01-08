import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { LoginPage, RegisterPage } from './pages/Auth';
import { PlannerPage } from './pages/Planner';
import { MetricsPage } from './pages/Metrics';
import './App.css';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme, loadUserTheme } = useTheme();
  const [authMode, setAuthMode] = useState('login');
  const [currentPage, setCurrentPage] = useState('planner');

  // Load user theme preference when logged in
  useEffect(() => {
    if (user) {
      loadUserTheme();
    }
  }, [user]);

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!user) {
    if (authMode === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthMode('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <div className="app">
      {/* Top Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">Daily Planner</div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'planner' ? 'active' : ''}`}
            onClick={() => setCurrentPage('planner')}
          >
            📋 Planner
          </button>
          <button
            className={`nav-link ${currentPage === 'metrics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('metrics')}
          >
            📊 Analytics
          </button>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {currentPage === 'planner' ? <PlannerPage /> : <MetricsPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          <button
            className={`mobile-nav-item ${currentPage === 'planner' ? 'active' : ''}`}
            onClick={() => setCurrentPage('planner')}
          >
            <span className="mobile-nav-icon">📋</span>
            <span>Planner</span>
          </button>
          <button
            className={`mobile-nav-item ${currentPage === 'metrics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('metrics')}
          >
            <span className="mobile-nav-icon">📊</span>
            <span>Analytics</span>
          </button>
          <button
            className="mobile-nav-item"
            onClick={toggleTheme}
          >
            <span className="mobile-nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>Theme</span>
          </button>
          <button
            className="mobile-nav-item"
            onClick={logout}
          >
            <span className="mobile-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
