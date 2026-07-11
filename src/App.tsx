import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

const Explore  = lazy(() => import('./pages/Explore'));
const Practice = lazy(() => import('./pages/Practice'));
const Learn    = lazy(() => import('./pages/Learn'));
const About    = lazy(() => import('./pages/About'));

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-screen" />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"          element={<Explore />}  />
              <Route path="/practice"  element={<Practice />} />
              <Route path="/learn"     element={<Learn />}    />
              <Route path="/about"     element={<About />}    />

              <Route path="/home"      element={<Navigate to="/" replace />} />
              <Route path="/dashboard" element={<Navigate to="/practice" replace />} />
              <Route path="/lab"       element={<Navigate to="/practice" replace />} />
              <Route path="/research"  element={<Navigate to="/learn" replace />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
