import { useEffect, useState } from 'react';
import { CheckoutModal } from './components/CheckoutModal';
import { Footer } from './components/Footer';
import { AppRoute, Navbar } from './components/Navbar';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { ProductsPage } from './pages/ProductsPage';
import { PlanTier, SkillId } from './utils/tiers';

const TIER_STORAGE_KEY = 'patchwork:active-tier';

function parseRouteFromHash(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  if (hash === 'products') return 'products';
  if (hash === 'docs') return 'docs';
  if (hash === 'pricing') return 'pricing';
  return 'home';
}

function readStoredTier(): PlanTier {
  try {
    const val = window.localStorage.getItem(TIER_STORAGE_KEY);
    if (val === 'free' || val === 'pro' || val === 'max') return val;
  } catch {
    // ignore storage failures
  }
  return 'free';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(parseRouteFromHash);
  const [activeTier, setActiveTier] = useState<PlanTier>(readStoredTier);
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId>('hydrogen');
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const nextHash = nextRoute === 'home' ? '#/' : `#/${nextRoute}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleActivateTier = (tier: PlanTier) => {
    setActiveTier(tier);
    try {
      window.localStorage.setItem(TIER_STORAGE_KEY, tier);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar route={route} onNavigate={navigate} />

      <main className="flex-1">
        {route === 'home' && (
          <HomePage
            activeTier={activeTier}
            onNavigate={navigate}
            onSelectSkillDetail={(id) => setSelectedSkillId(id)}
            onRequestUpgrade={(tier) => setCheckoutTier(tier)}
          />
        )}

        {route === 'products' && (
          <ProductsPage
            activeTier={activeTier}
            selectedSkillId={selectedSkillId}
            onSelectSkillId={setSelectedSkillId}
            onRequestUpgrade={(tier) => setCheckoutTier(tier)}
            onNavigate={navigate}
          />
        )}

        {route === 'docs' && <DocsPage onNavigate={navigate} />}

        {route === 'pricing' && (
          <PricingPage
            activeTier={activeTier}
            onSelectTier={(tier) => setCheckoutTier(tier)}
            onNavigate={navigate}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />

      <CheckoutModal
        targetTier={checkoutTier}
        onClose={() => setCheckoutTier(null)}
        onActivateTier={(tier) => handleActivateTier(tier)}
      />
    </div>
  );
}
