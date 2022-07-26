import { AccessoryConfig, AccessoryPlugin, API, Logging, Service } from 'homebridge';
import { Humidifier2 } from './humidifier2';

export class HumidifierAccessory implements AccessoryPlugin {
  client: Humidifier2;

  readonly infoService: Service;
  readonly screenService: Service;
  readonly humidifierService: Service;
  readonly temperatureSensor: Service;

  // Update Interval in milliseconds
  readonly interval = 10_000;

  constructor(public logger: Logging, public config: AccessoryConfig, public api: API) {
    logger.debug(JSON.stringify(config, null, 2));

    const { Characteristic, Service } = api.hap;

    this.client = new Humidifier2(config.ip, config.token);

    this.infoService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'SmartMi')
      .setCharacteristic(Characteristic.Model, 'Humidifier2')
      .setCharacteristic(Characteristic.SerialNumber, config.ip);

    // 1. Screen On/Off
    this.screenService = new Service.Switch('Screen On/Off');
    this.screenService
      .getCharacteristic(Characteristic.On)
      .onGet(async () => {
        const value = await this.client.getScreenBrightness();
        return value > 0;
      })
      .onSet((value) => {
        this.client.setScreenBrightness(value ? 1 : 0);
      });

    // 2. Temperature Sensor
    this.temperatureSensor = new Service.TemperatureSensor('智米温度');
    this.temperatureSensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(() => this.client.getTemperature());

    // Main Service: HumidifierDehumidifier
    this.humidifierService = new Service.HumidifierDehumidifier(config.name);
    this.humidifierService.setPrimaryService(true);

    // Power active or not
    this.humidifierService.getCharacteristic(Characteristic.Active).onSet((value) => {
      logger.info('setPower: ', value);
      this.client.power(value == 1);
    });

    // Current Humidifier State (Auto / Humidifying / Dehumidifying / Off)
    this.humidifierService
      .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
      .setProps({ validValues: [0, 2] });
    // 0 = INACTIVE | 2 = HUMIDIFYING

    // Target Humidifier Dehumidifier State
    this.humidifierService
      .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
      .setProps({ validValues: [0] });
    // 0 = HUMIDIFIER_OR_DEHUMIDIFIER

    // Current Relative Humidity
    this.humidifierService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(() => this.client.getHumidity());

    // Water level
    this.humidifierService
      .getCharacteristic(Characteristic.WaterLevel)
      .onGet(() => this.client.getWaterLevel());

    // Disabled: Fan Level
    // this.humidifierService
    //   .getCharacteristic(Characteristic.RotationSpeed)
    //   .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
    //   .onGet(() => this.client.getFanLevel())
    //   .onSet((value) => {
    //     logger.info('setFanLevel: ', value);
    //     if (value >= 1 && value < 33) {
    //       this.client.setFanLevel(1);
    //     } else if (value >= 33 && value <= 66) {
    //       this.client.setFanLevel(2);
    //     } else if (value > 66 && value <= 100) {
    //       this.client.setFanLevel(3);
    //     }
    //   });

    setInterval(() => {
      this.client.batchGet().then((result) => {
        // this.logger.debug("batchGet: ", result);

        // Power
        this.humidifierService
          .getCharacteristic(Characteristic.Active)
          .updateValue(result[0].value);

        // Screen Brightness
        this.screenService
          .getCharacteristic(Characteristic.Brightness)
          .updateValue(result[5].value);

        // Screen On/Off
        this.screenService.getCharacteristic(Characteristic.On).updateValue(result[5].value > 0);

        this.humidifierService
          .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
          .updateValue(
            result[0].value
              ? Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING
              : Characteristic.CurrentHumidifierDehumidifierState.INACTIVE,
          );

        // Water Level
        this.humidifierService
          .getCharacteristic(Characteristic.WaterLevel)
          .updateValue(result[3].value / 1.25);

        // this.humidifierService
        //   .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
        //   .updateValue(result[1].value);

        this.humidifierService
          .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
          .setValue(Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER_OR_DEHUMIDIFIER);

        // Humidity
        this.humidifierService
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(result[1].value);

        // Water level
        this.humidifierService
          .getCharacteristic(Characteristic.WaterLevel)
          .updateValue(result[3].value / 1.25);

        // Temperature
        this.temperatureSensor
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(result[7].value);
      });
    }, this.interval);
  }

  getServices() {
    return [this.infoService, this.screenService, this.temperatureSensor, this.humidifierService];
  }
}
