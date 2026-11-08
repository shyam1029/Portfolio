import { create } from 'zustand';

type VoyageState = {
  /** Page scroll progress, 0 at the top and 1 at the bottom. */
  progress: number;
  setProgress: (progress: number) => void;
  /** True once the first frames have rendered (shaders compiled). */
  ready: boolean;
  setReady: () => void;
};

// In useFrame read `useVoyage.getState().progress` (no re-render).
// In UI select a derived value, e.g. `useVoyage((s) => s.progress > 0.5)`.
export const useVoyage = create<VoyageState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
  ready: false,
  setReady: () => set({ ready: true }),
}));
