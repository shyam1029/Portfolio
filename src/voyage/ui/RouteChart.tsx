import { chapters } from '../../content/story';
import { useVoyage } from '../world/store';

const W = 180;
const H = 36;

/** A small sea chart: one stop per chapter, with the ship marker moving along the course. */
export function RouteChart() {
  const progress = useVoyage((s) => Math.round(s.progress * 200) / 200);
  const x = (t: number) => 8 + t * (W - 16);
  const y = (t: number) => H / 2 + Math.sin(t * Math.PI * 3) * 7;
  const path = Array.from({ length: 41 }, (_, i) => `${i ? 'L' : 'M'}${x(i / 40).toFixed(1)},${y(i / 40).toFixed(1)}`).join(' ');

  return (
    <nav className="route-chart" aria-label="Voyage progress">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Voyage ${Math.round(progress * 100)}% complete`}>
        <path d={path} className="route-chart-course" />
        {chapters.map((c) => {
          const t = (c.range[0] + c.range[1]) / 2;
          const reached = progress >= c.range[0];
          return (
            <circle key={c.id} cx={x(t)} cy={y(t)} r={3.2} className={reached ? 'stop is-reached' : 'stop'}>
              <title>{c.title}</title>
            </circle>
          );
        })}
        <g transform={`translate(${x(progress)},${y(progress)})`}>
          <path d="M-5,1 L5,1 L3,4 L-3,4 Z M0,1 L0,-6 L4,-1 Z" className="route-chart-ship" />
        </g>
      </svg>
    </nav>
  );
}
