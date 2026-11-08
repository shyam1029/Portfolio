# The Voyage: Roadmap

## Milestone 1: World and story skeleton ✅
- Astro 7 + React island + R3F; GitHub Pages workflow
- Story data model: chapters, log lines, palettes, camera framing
- Cel-shaded ocean (banded water, inked foam, shore rings), sky with sun/moon and stars, toon clouds, rain and lightning
- Procedural ship with an original 8-bit skull flag; placeholder chibi captain
- Islands: Lantern Harbour, Arcade Isle (playable game bottles), Lighthouse Point, Wireframe Isle (draws itself), Engine Harbour
- Captain's log, chapter title cards, route chart, the dream, the wanted poster, About page

## Milestone 2: The captain
- Load the VRoid avatar (`public/models/captain.vrm`) with `@pixiv/three-vrm`
- Mixamo clips: idle, steering in the storm, pointing at islands, cheering at the flag raise
- Render a portrait from the avatar for the wanted poster and About page

## Milestone 3: Cinematic polish
- Young captain in a rowboat for The Spark, growing into the ship
- Storm: bigger swells, spray, a near-miss lightning strike on the mast
- Sunrise finale: sun breaking through clouds, gulls, the poster pinned to the mast
- Ambient audio (waves, wind, storm) with a mute toggle, off by default
- Optional outline post-process for a stronger anime ink look

## Milestone 4: Performance and accessibility
- Adaptive DPR via drei `PerformanceMonitor`; reduce outlines and ocean segments on mobile
- Reduced-motion mode: crossfades between chapters instead of sailing
- Lighthouse pass and an OG share image
