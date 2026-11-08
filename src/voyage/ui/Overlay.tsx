import { chapters, finale } from '../../content/story';
import { withBase } from '../../lib/url';
import { useVoyage } from '../world/store';
import { chapterAt } from '../world/atmosphere';
import { RouteChart } from './RouteChart';
import { WantedPoster } from './WantedPoster';

function CaptainsLog() {
  // Re-render only when the visible line changes.
  const line = useVoyage((s) => {
    for (const c of chapters) for (const l of c.log) if (s.progress >= l.at[0] && s.progress < l.at[1]) return l.text;
    return null;
  });
  return (
    <div className="log" aria-live="polite">
      <p key={line ?? 'none'} className={`log-line${line ? ' is-visible' : ''}`}>
        {line}
      </p>
    </div>
  );
}

function ChapterTitle() {
  const chapter = useVoyage((s) => {
    const c = chapterAt(s.progress);
    const local = (s.progress - c.range[0]) / (c.range[1] - c.range[0]);
    return local > 0.02 && local < 0.3 ? c.id : null;
  });
  const c = chapters.find((ch) => ch.id === chapter);
  return (
    <div className={`chapter-title${c ? ' is-visible' : ''}`} aria-hidden={!c}>
      {c && (
        <>
          <span className="chapter-place">{c.place}</span>
          <h2>{c.title}</h2>
        </>
      )}
    </div>
  );
}

function Dream() {
  const visible = useVoyage((s) => s.progress >= finale.dreamAt && s.progress < finale.posterAt);
  return (
    <p className={`dream${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      Be innovative.
      <br />
      Try, and learn as much as possible.
    </p>
  );
}

function ScrollHint() {
  const visible = useVoyage((s) => s.progress < 0.01);
  return (
    <div className={`scroll-hint${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      Scroll to set sail
    </div>
  );
}

export function Overlay() {
  const posterVisible = useVoyage((s) => s.progress >= finale.posterAt);
  return (
    <div className="overlay">
      <a className="skip-link" href={`${withBase('about')}`}>
        Skip the voyage and read about me
      </a>
      <ChapterTitle />
      <CaptainsLog />
      <Dream />
      <RouteChart />
      <ScrollHint />
      <WantedPoster visible={posterVisible} />
    </div>
  );
}
