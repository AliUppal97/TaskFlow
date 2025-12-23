/**
 * Window object extensions for global utilities
 */

export interface MockAuthGlobal {
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  enableAuto: () => void;
  disableAuto: () => void;
}

declare global {
  interface Window {
    mockAuth?: MockAuthGlobal;
  }
}






