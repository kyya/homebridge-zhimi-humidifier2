# homebridge-zhimi-humidifier

Tested on [zhimi.humidifier.ca4](https://home.miot-spec.com/s/zhimi.humidifier.ca4)

## Installation

1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).  
   If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.
3. Install packages.

```
npm install -g homebridge-smartmi-humidifier2
```

```
"accessories": [
    {
      "accessory": "MiHumidifier2",
      "name": "zhimi.humidifier.ca4",
      "ip": "192.168.1.3",
      "token": "12345678912345678912345678912345",
      "showTemperatureDisable": false,
      "showTemperatureSensorName": "temperature",
      "updateTimer": 60
    }
  ]
```
