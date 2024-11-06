import { create } from 'zustand';

import {
  SecretoriumRegistryProcessReadable,
  SecretoriumRegistryProcessWritable,
} from './processes/secretorium_registry';

export type GlobalState = {
  showMenu: boolean;
  secretoriumRegistry:
    | SecretoriumRegistryProcessReadable
    | SecretoriumRegistryProcessWritable;
};

export type GlobalStateActions = {
  setShowMenu: (showMenu: boolean) => void;
  setSecretoriumRegistry: (
    s: SecretoriumRegistryProcessReadable | SecretoriumRegistryProcessWritable,
  ) => void;
  reset: () => void;
};

export const initialGlobalState: GlobalState = {
  showMenu: false,
  secretoriumRegistry: new SecretoriumRegistryProcessReadable(),
};

export class GlobalStateActionBase implements GlobalStateActions {
  constructor(
    private set: (props: any) => void,
    private initialGlobalState: GlobalState,
  ) {}

  setShowMenu = (showMenu: boolean) => {
    this.set({ showMenu });
  };

  setSecretoriumRegistry = (
    secretoriumRegistry:
      | SecretoriumRegistryProcessReadable
      | SecretoriumRegistryProcessWritable,
  ) => {
    secretoriumRegistry.kvRegistry.process.startPolling();
    this.set({ secretoriumRegistry });
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
