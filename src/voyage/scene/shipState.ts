import { Vector3 } from 'three';

/** Where the ship is this frame. Written by Ship, read by CameraRig. */
export const shipState = {
  position: new Vector3(),
  forward: new Vector3(0, 0, -1),
};
