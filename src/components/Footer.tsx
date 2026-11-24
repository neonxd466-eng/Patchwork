import { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-[var(--text)]">Patchwork</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Modular AI skill specifications for video editing, pacing, and motion graphics.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-soft)]">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="hover:text-[var(--text)] transition-colors"
          >
            Home
          </a>
          <a
            href="#/products"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('products');
            }}
            className="hover:text-[var(--text)] transition-colors"
          >
            Products
          </a>
          <a
            href="#/docs"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('docs');
            }}
            className="hover:text-[var(--text)] transition-colors"
          >
            Docs
          </a>
          <a
            href="#/pricing"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('pricing');
            }}
            className="hover:text-[var(--text)] transition-colors"
          >
            Pricing
          </a>
        </nav>

        <p className="text-xs text-[var(--muted)]">© 2026 Patchwork. Skill files distributed as plain Markdown.</p>
      </div>
    </footer>
  );
}
