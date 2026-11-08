import { captain } from '../../content/story';
import { withBase } from '../../lib/url';

/** Our own take on a pirate wanted poster: parchment, wood-type lettering, an XP bounty. */
export function WantedPoster({ visible }: { visible: boolean }) {
  return (
    <section className={`poster-wrap${visible ? ' is-visible' : ''}`} aria-hidden={!visible} inert={!visible}>
      {/* SVG filters: paper fibres, and a displacement that tears and roughens the edges. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="poster-torn" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="poster-fibres">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.22 0" />
        </filter>
      </svg>
      <article className="poster" aria-label="Wanted poster">
        <div className="poster-paper" aria-hidden="true">
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <rect width="100%" height="100%" filter="url(#poster-fibres)" />
          </svg>
        </div>
        <h2 className="poster-wanted">Wanted</h2>
        <div className="poster-portrait">
          <img src={withBase('images/captain-portrait.svg')} alt="Portrait of Captain Syam" width={240} height={200} />
        </div>
        <p className="poster-sought">Alive, and still learning</p>
        <p className="poster-name">{captain.name}</p>
        <p className="poster-epithet">“{captain.epithet}”</p>
        <p className="poster-bounty">
          <span aria-hidden="true">⚓</span> {captain.bounty} <small>XP</small>
        </p>
        <p className="poster-charge">Wanted for building worlds inside a browser.</p>
      </article>
      <nav className="poster-actions" aria-label="Contact">
        <a href={`mailto:${captain.email}`}>Send a message</a>
        <a href={captain.github} target="_blank" rel="noreferrer">GitHub</a>
        <a href={captain.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        <a href={withBase('about')} className="primary">Meet the captain</a>
      </nav>
    </section>
  );
}
