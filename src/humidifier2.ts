import miio from 'miio';

export type MiioResult = {
  uid: string;
  did: string;
  siid: number;
  piid: number;
  code: number;
  value: number;
};

type MiioConfig = {
  refresh: string[];
  refreshDelay: number;
};

interface MiioDevice {
  call(method: 'miIO.info', params: any[], config?: MiioConfig): Promise<MiioResult>;
  call(method: 'set_properties', params: any[], config?: MiioConfig): Promise<MiioResult[]>;
  call(method: 'get_properties', params: any[], config?: MiioConfig): Promise<MiioResult[]>;
}

export class Humidifier2 {
  id: string = '';
  device?: MiioDevice;

  constructor(public address: string, public token: string) {}

  initDevice(): Promise<MiioDevice> {
    return new Promise((resolve) => {
      miio
        .device({ address: this.address, token: this.token })
        .then((device: MiioDevice) => {
          device.call('miIO.info', []).then((r) => {
            this.id = r.uid;
            this.device = device;
            resolve(device);
            // console.log("Connected to ID", r.uid);
            // this.emit("ready", { id: r.uid, device });
          });
        })
        .catch((err) => {
          console.error('initDevice Error: ', err);
        });
    });
  }

  getDevice(): Promise<MiioDevice> {
    if (this.device) {
      return Promise.resolve(this.device);
    } else {
      return this.initDevice();
    }
  }

  power(value: boolean) {
    return this.getDevice()
      .then((device) => {
        return device.call('set_properties', [{ did: this.id, siid: 2, piid: 1, value }], {
          refresh: ['power', 'mode'],
          refreshDelay: 200,
        });
      })
      .then((result) => result[0].code === 0);
  }

  getTemperature(): Promise<number> {
    return this.getDevice().then((device) => {
      return device
        .call('get_properties', [{ did: this.id, siid: 3, piid: 7, value: null }])
        .then(([result]) => result.value);
    });
  }

  getFanLevel(): Promise<number> {
    return this.getDevice().then((device) => {
      return device
        .call('get_properties', [{ did: this.id, siid: 2, piid: 5, value: null }])
        .then(([result]) => {
          const mode = result.value;
          console.log('[MiHumidifier2] - getFanLevel: ', mode);
          return mode;
        });
    });
  }

  // Fan Level: 0 is auto, 1-3 is manual
  setFanLevel(level: number) {
    return this.getDevice().then((device) => {
      return device.call('set_properties', [{ did: this.id, siid: 2, piid: 5, value: level }]);
    });
  }

  setSpeedLevel(value: number) {
    return this.getDevice().then((device) => {
      return device.call('set_properties', [{ did: this.id, siid: 2, piid: 11, value }]);
    });
  }

  getWaterLevel(): Promise<number> {
    return this.getDevice().then((device) => {
      return device
        .call('get_properties', [{ did: this.id, siid: 2, piid: 7, value: null }])
        .then(([result]) => {
          // TODO: Magic number 1.25 or (115/128)
          console.log('[MiHumidifier2] - getWaterLevel: ', result.value / 1.25);
          return result.value / 1.25;
        });
    });
  }

  getHumidity(): Promise<number> {
    return this.getDevice().then((device) => {
      return device
        .call('get_properties', [{ did: this.id, siid: 3, piid: 9, value: null }])
        .then(([result]) => result.value);
    });
  }

  setHumidityHumidifierThreshold(value: number) {
    return this.getDevice().then((device) => {
      return device.call('get_properties', [{ did: this.id, siid: 2, piid: 6, value }]);
    });
  }

  getScreenBrightness(): Promise<number> {
    return this.getDevice().then((device) => {
      return device
        .call('get_properties', [{ did: this.id, siid: 5, piid: 2, value: null }])
        .then(([result]) => result.value);
    });
  }

  /**
   *
   * @param {number} value
   * 0 - Dark
   * 1 - Glimmer
   * 2 - Brightest
   */
  setScreenBrightness(value: number): void {
    this.getDevice().then((device) => {
      return device.call('set_properties', [{ did: this.id, siid: 5, piid: 2, value }]);
    });
  }

  batchGet(): Promise<MiioResult[]> {
    return this.getDevice().then((device) => {
      return device.call('get_properties', [
        { did: this.id, siid: 2, piid: 1, value: null },
        // Current Environment Humidity
        { did: this.id, siid: 3, piid: 9, value: null },
        { did: this.id, siid: 6, piid: 1, value: null },
        { did: this.id, siid: 2, piid: 7, value: null },
        { did: this.id, siid: 2, piid: 8, value: null },
        { did: this.id, siid: 5, piid: 2, value: null },
        // Fan Level
        { did: this.id, siid: 2, piid: 5, value: null },
        { did: this.id, siid: 3, piid: 7, value: null },
        // Target Environment Humidity
        { did: this.id, siid: 2, piid: 6, value: null },
      ]);
    });
  }
}
