import { useEffect, useRef } from 'react';
import { chapters, games } from '../../content/story';
import { bottleLabels } from '../world/bottleLabels';
import { useVoyage } from '../world/store';

const arcade = chapters.find((c) => c.id === 'arcade')!;

/** Name tags for the game bottles, positioned from the bottles' projected screen positions. */
export function BottleLabels() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const nearby = useVoyage((s) => s.progress > arcade.range[0] + 0.01 && s.progress < arcade.range[1]);

  useEffect(() => {
    if (!nearby) return;
    let raf = 0;
    const tick = () => {
      bottleLabels.forEach((b, i) => {
        const el = refs.current[i];
        if (!el) return;
        el.style.transform = `translate(-50%, -100%) translate(${b.x}px, ${b.y}px)`;
        el.classList.toggle('is-near', b.onScreen);
        el.classList.toggle('is-hover', b.hover);
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [nearby]);

  if (!nearby) return null;
  return (
    <div className="bottle-labels" aria-hidden="true">
      {games.map((g, i) => (
        <div key={g.title} ref={(el) => { refs.current[i] = el; }} className="bottle-label">
          <strong>{g.title}</strong>
          <span className="bottle-label-hint">{g.blurb} Click to play.</span>
        </div>
      ))}
    </div>
  );
}
