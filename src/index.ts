import type { API } from 'homebridge';
import { HumidifierAccessory } from './HumidifierAccessory';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  // api.registerAccessory(ACCESSORY_NAME, NaderAccessory);
  api.registerAccessory('MiHumidifier2', HumidifierAccessory);
};
