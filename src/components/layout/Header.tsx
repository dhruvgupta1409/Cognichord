import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, FlaskConical } from 'lucide-react';

const navItems = [
  { path: '/',          label: 'Home'       },
  { path: '/lab',       label: 'Lab'        },
  { path: '/dashboard', label: 'Dashboard'  },
  { path: '/learn',     label: 'Learn'      },
  { path: '/research',  label: 'Research'   },
  { path: '/about',     label: 'About'      },
];

export default function Header() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center group-hover:border-cyan/40 group-hover:bg-cyan/15 transition-all">
            <FlaskConical className="w-4 h-4 text-cyan" />
          </div>
          <span className="font-display font-600 text-base tracking-tight">
            <span className="gradient-text-cyan">Cogni</span>
            <span className="text-slate-300">chord</span>
          </span>
        </Link>

                <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link px-3 py-1.5 rounded-md ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

                <div className="hidden md:flex items-center gap-3">
          <Link to="/lab" className="btn-primary text-xs py-2 px-4">
            Open Lab
          </Link>
        </div>

                <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

            <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-bg-primary/95 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
          >
            <nav className="px-6 py-4 flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-cyan/10 text-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                <Link to="/lab" className="btn-primary block text-center text-sm py-2.5 mt-2">
                  Open Lab
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
