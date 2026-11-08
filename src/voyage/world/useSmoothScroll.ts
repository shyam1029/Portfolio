import { useEffect } from 'react';
import Lenis from 'lenis';
import { useVoyage } from './store';

/** Lenis smooth scrolling on the window; publishes progress to the voyage store. */
export function useSmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({ autoRaf: true, lerp: reduceMotion ? 1 : 0.08 });
    const { setProgress } = useVoyage.getState();
    lenis.on('scroll', ({ progress }: Lenis) => setProgress(Math.min(Math.max(progress || 0, 0), 1)));
    return () => lenis.destroy();
  }, []);
}
