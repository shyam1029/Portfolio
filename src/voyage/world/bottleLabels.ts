import { games } from '../../content/story';

/** Screen positions of the game bottles, written by each Bottle every frame and read by the DOM labels. */
export const bottleLabels = games.map(() => ({ x: 0, y: 0, onScreen: false, hover: false }));
