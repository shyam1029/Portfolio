import { captain } from '../../content/story';
import { withBase } from '../../lib/url';

/** Our own take on a pirate wanted poster: parchment, wood-type lettering, an XP bounty. */
export function WantedPoster({ visible }: { visible: boolean }) {
  return (
    <section className={`poster-wrap${visible ? ' is-visible' : ''}`} aria-hidden={!visible} inert={!visible}>
      <article className="poster" aria-label="Wanted poster">
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
