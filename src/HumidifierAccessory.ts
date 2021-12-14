import { AccessoryConfig, AccessoryPlugin, API, Logging, Service } from 'homebridge';
import { Humidifier2 } from './humidifier2';

export class HumidifierAccessory implements AccessoryPlugin {
  client: Humidifier2;

  readonly infoService: Service;
  readonly displayService: Service;
  readonly humidifierService: Service;

  readonly humiditySensor: Service;
  readonly temperatureSensor: Service;

  // Update Interval in milliseconds
  readonly interval = 3000;

  constructor(public logger: Logging, public config: AccessoryConfig, public api: API) {
    logger.debug(JSON.stringify(config, null, 2));

    const { Characteristic, Service } = api.hap;

    this.client = new Humidifier2(config.ip, config.token);

    this.infoService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'SmartMi')
      .setCharacteristic(Characteristic.Model, 'Humidifier2')
      .setCharacteristic(Characteristic.SerialNumber, config.ip);

    this.displayService = new Service.Lightbulb('Screen Brightness');

    this.displayService
      .getCharacteristic(Characteristic.On)
      .onGet(() => {
        return this.client.getScreenBrightness().then((value) => {
          logger.info('getScreenBrightness: ', value);
          return value > 0;
        });
      })
      .onSet((value) => {
        logger.info('setScreenPower: ', value);
        this.client.setScreenBrightness(value ? 1 : 0);
      });

    this.displayService
      .getCharacteristic(Characteristic.Brightness)
      .setProps({ minValue: 0, maxValue: 2, minStep: 1 })
      .onGet(() => this.client.getScreenBrightness())
      .onSet((value) => {
        logger.info('setScreenBrightness: ', value);
        this.client.setScreenBrightness(value as number);
      });

    // Temperature Sensor
    this.temperatureSensor = new Service.TemperatureSensor('Temperature');
    this.temperatureSensor
      .getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(() => this.client.getTemperature());

    // Humidity Sensor
    this.humiditySensor = new Service.HumiditySensor('Humidify Sensor');

    this.humiditySensor
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(() => this.client.getHumidity());

    // Main Service: HumidifierDehumidifier
    this.humidifierService = new Service.HumidifierDehumidifier(config.name);
    this.humidifierService.isPrimaryService = true;

    // Power active or not
    this.humidifierService.getCharacteristic(Characteristic.Active).onSet((value) => {
      logger.info('setPower: ', value);
      this.client.power(value == 1);
    });

    // Current Humidifier State (Auto / Humidifying / Dehumidifying / Off)
    this.humidifierService
      .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
      .setProps({ validValues: [0, 2] });

    // Target Humidifier Dehumidifier State
    this.humidifierService
      .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
      .setProps({ validValues: [1] });

    this.humidifierService
      .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: 1,
      })
      .onGet(() => this.client.getHumidity());
    // .onSet((value) => {
    //   // TODO: Setting Target Humidity Threshold
    //   logger.debug(`Setting Humidity Threshold to ${value}`);
    //   this.client.setHumidityHumidifierThreshold(value as number);
    // });

    // Current Relative Humidity
    this.humidifierService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(() => this.client.getHumidity());

    // Water level
    this.humidifierService
      .getCharacteristic(Characteristic.WaterLevel)
      .onGet(() => this.client.getWaterLevel());

    // Fan Level
    this.humidifierService
      .getCharacteristic(Characteristic.RotationSpeed)
      .setProps({ minValue: 0, maxValue: 100, minStep: 25 })
      .onGet(() => this.client.getFanLevel())
      .onSet((value) => {
        logger.info('setFanLevel: ', value);
        if (value >= 1 && value < 33) {
          this.client.setFanLevel(1);
        } else if (value >= 33 && value <= 66) {
          this.client.setFanLevel(2);
        } else if (value > 66 && value <= 100) {
          this.client.setFanLevel(3);
        }
      });

    setInterval(() => {
      this.client.batchGet().then((result) => {
        // this.logger.debug("batchGet: ", result);

        // Power
        this.humidifierService
          .getCharacteristic(Characteristic.Active)
          .updateValue(result[0].value);

        // Screen Brightness
        this.displayService
          .getCharacteristic(Characteristic.Brightness)
          .updateValue(result[5].value);

        // Screen On/Off
        this.displayService.getCharacteristic(Characteristic.On).updateValue(result[5].value > 0);

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

        this.humidifierService
          .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
          .updateValue(result[1].value);

        this.humidifierService
          .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
          .setValue(Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER);

        // Humidity
        this.humiditySensor
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(result[1].value);

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

        // Fan Level
        // this.humidifierService
        //   .getCharacteristic(Characteristic.RotationSpeed)
        //   .updateValue(result[8].value);
      });
    }, this.interval);
  }

  getServices() {
    return [
      this.infoService,
      this.displayService,
      this.humidifierService,
      this.temperatureSensor,
      this.humiditySensor,
    ];
  }
}
