import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export type AppRoute = 'home' | 'products' | 'docs' | 'pricing';

interface NavbarProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_LINKS: { id: AppRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Products' },
  { id: 'docs', label: 'Docs' },
  { id: 'pricing', label: 'Pricing' },
];

export function Navbar({ route, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (target: AppRoute) => {
    setMobileOpen(false);
    onNavigate(target);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-[var(--border-hairline)] bg-[#06070c]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            go('home');
          }}
          className="font-display text-xl font-medium tracking-[-0.02em] text-[var(--text)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] rounded-sm"
        >
          Patchwork
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const active = route === link.id;
            return (
              <a
                key={link.id}
                href={`#/${link.id === 'home' ? '' : link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(link.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 transition-colors duration-150 underline-offset-8 ${
                  active
                    ? 'text-[var(--text)] underline decoration-[var(--accent)] decoration-2'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)] hover:underline hover:decoration-white/30'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => go('products')}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#06070c] hover:bg-[#94b5ff] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Download Skills
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[var(--text)] hover:bg-white/5 cursor-pointer"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-hairline)] bg-[#06070c]/95 px-6 py-4">
          <nav aria-label="Mobile Primary" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const active = route === link.id;
              return (
                <a
                  key={link.id}
                  href={`#/${link.id === 'home' ? '' : link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(link.id);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`py-2 text-base font-medium ${
                    active ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => go('products')}
              className="mt-2 w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#06070c] cursor-pointer"
            >
              Download Skills
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
