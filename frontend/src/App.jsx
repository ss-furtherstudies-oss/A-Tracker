import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// ─── Global Error Boundary ────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-black text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-black text-sm hover:bg-orange-600 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-load pages so each is a separate JS bundle.
// React only downloads + parses a page's code when the user first navigates to it.
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const StudentsGrid = lazy(() => import('./pages/StudentsGrid'));
const DataEntryForm = lazy(() => import('./pages/DataEntryForm'));
const UAppGrid     = lazy(() => import('./pages/UAppGrid'));
const QSRankings   = lazy(() => import('./pages/QSRankings'));
const Statistics   = lazy(() => import('./pages/Statistics'));
const Settings     = lazy(() => import('./pages/Settings'));

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { QSProvider } from './context/QSContext';
import { StudentProvider } from './context/StudentContext';

// Lightweight page-transition skeleton shown while a lazy bundle loads
const PageSkeleton = () => (
  <div className="flex-1 p-8 space-y-4 animate-pulse">
    <div className="h-8 w-48 bg-slateBlue-200/60 rounded-xl" />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
    </div>
    <div className="h-64 bg-white rounded-2xl border border-gray-100" />
  </div>
);

function AppContent() {
  const { user, role } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slateBlue-100 text-slateBlue-800">
      <Sidebar />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-0 md:pl-20">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slateBlue-100 p-4 md:p-8 pb-24 md:pb-8">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"          element={<Dashboard />} />
              <Route path="/students"           element={<StudentsGrid />} />
              
              {/* Protected Routes */}
              <Route 
                path="/students/new"       
                element={role === 'ADMIN' ? <DataEntryForm /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/students/edit/:id"  
                element={role === 'ADMIN' ? <DataEntryForm /> : <Navigate to="/" replace />} 
              />

              <Route path="/applications"       element={<UAppGrid />} />
              <Route path="/rankings"           element={<QSRankings />} />
              <Route path="/statistics"         element={<Statistics />} />
              <Route path="/settings"           element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <QSProvider>
            <StudentProvider>
              <AppContent />
            </StudentProvider>
          </QSProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
