import { create } from "zustand";

export interface UseIntro {
  /** True once the intro preloader has finished its center→corner handoff. */
  done: boolean;
  setDone: (done: boolean) => void;
}

/**
 * Tracks whether the intro `<Preloader>` has completed. The corner `<SiteLogo>`
 * subscribes so it only appears *after* the preloader's monogram has landed in the
 * corner — the loader's mark hands off seamlessly to the persistent logo, instead
 * of the always-on logo sitting underneath the flying one.
 */
export const useIntro = create<UseIntro>((set) => ({
  done: false,
  setDone: (done) => set({ done }),
}));
