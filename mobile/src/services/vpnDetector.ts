import { registerPlugin } from '@capacitor/core';

export interface VpnDetectorPlugin {
  isVpnActive(): Promise<{ isActive: boolean }>;
}

const VpnDetector = registerPlugin<VpnDetectorPlugin>('VpnDetector');

export default VpnDetector;
