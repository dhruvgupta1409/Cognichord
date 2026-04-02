import { Link } from 'react-router-dom';
import { FlaskConical, Github, ExternalLink } from 'lucide-react';

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
              Computational models linking musical activity to neurotransmitter dynamics,
              synaptic plasticity, and long-term cognitive performance.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <span className="tag tag-cyan">Research Platform</span>
              <span className="tag tag-purple">Open Science</span>
            </div>
          </div>

                    <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/lab', label: 'Simulation Lab' },
                { to: '/dashboard', label: 'Practice Dashboard' },
                { to: '/research', label: 'Community Research' },
                { to: '/learn', label: 'Education Hub' },
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
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Science</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/learn#dopamine',   label: 'Dopamine Dynamics'  },
                { to: '/learn#bdnf',       label: 'BDNF & Plasticity'  },
                { to: '/learn#synaptic',   label: 'Synaptic Models'    },
                { to: '/about',            label: 'Methodology'        },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-glow my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © 2025 Cognichord. Computational models are approximations for research and educational purposes and should not be used as medical devices.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-slate-600 hover:text-slate-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-cyan transition-colors"
            >
              Preprint <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
