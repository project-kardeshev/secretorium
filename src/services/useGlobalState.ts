import { create } from 'zustand';

export type GlobalState = {
  showMenu: boolean;
};

export type GlobalStateActions = {
  setShowMenu: (showMenu: boolean) => void;
  reset: () => void;
};

export const initialGlobalState: GlobalState = {
  showMenu: false,
};

export class GlobalStateActionBase implements GlobalStateActions {
  constructor(
    private set: (props: any) => void,
    private initialGlobalState: GlobalState,
  ) {}

  setShowMenu = (showMenu: boolean) => {
    this.set({ showMenu });
  };

  reset = () => {
    this.set({ ...this.initialGlobalState });
  };
}

export interface GlobalStateInterface extends GlobalState, GlobalStateActions {}
export const useGlobalState = create<GlobalStateInterface>()((set: any) => ({
  ...initialGlobalState,
  ...new GlobalStateActionBase(set, initialGlobalState),
}));
