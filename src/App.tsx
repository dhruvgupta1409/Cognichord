import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Lab from './pages/Lab';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Research from './pages/Research';
import About from './pages/About';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"          element={<Home />}      />
            <Route path="/lab"       element={<Lab />}       />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn"     element={<Learn />}     />
            <Route path="/research"  element={<Research />}  />
            <Route path="/about"     element={<About />}     />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
