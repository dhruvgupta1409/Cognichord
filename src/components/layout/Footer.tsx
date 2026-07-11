import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-bg-secondary mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-cyan" />
              </div>
              <span className="font-display font-semibold text-base">
                <span className="gradient-text-cyan">Cogni</span>
                <span className="text-slate-300">chord</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Understand how your brain learns while you practice, using an interactive brain built from cited neuroscience.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <span className="tag tag-cyan">Interactive Neuroscience</span>
              <span className="tag tag-purple">Open Science</span>
            </div>
          </div>

                    <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/',         label: 'The Brain'    },
                { to: '/practice', label: 'Practice'     },
                { to: '/learn',    label: 'Learn'        },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

                    <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">About</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/about',          label: 'Methodology & model' },
                { to: '/about#credits',  label: 'Data sources & credits' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-glow my-8" />

        <p className="text-xs text-slate-600 text-center sm:text-left">
          © 2026 CogniChord · built by Dhruv Gupta. An educational, non-clinical tool — not a medical device.
          {' '}The 3D brain is a general representation (not anatomically exact), derived from open
          neuroscience datasets — FreeSurfer, Harvard-Oxford, AAL, and NeuroMorpho.org — used under their
          licenses. Full{' '}
          <Link to="/about#credits" className="hover:text-cyan transition-colors underline underline-offset-2">
            data sources &amp; credits
          </Link>.
        </p>
      </div>
    </footer>
  );
}
