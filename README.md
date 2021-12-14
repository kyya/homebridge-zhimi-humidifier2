# homebridge-zhimi-humidifier2

<a href="https://npmjs.com/package/homebridge-zhimi-humidifier2"><img src="https://img.shields.io/npm/v/homebridge-zhimi-humidifier2.svg" alt="npm package"></a>

A typescript version of [homebridge-smartmi-humidifier2](https://www.npmjs.com/package/homebridge-smartmi-humidifier2) 

Tested on [zhimi.humidifier.ca4](https://home.miot-spec.com/s/zhimi.humidifier.ca4)

## Installation

1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).  
   If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.
3. Install packages.

```
npm install -g homebridge-zhimi-humidifier2
```

```
"accessories": [
    {
      "accessory": "MiHumidifier2",
      "name": "zhimi.humidifier.ca4",
      "ip": "<replace with your device ip>",
      "token": "<replace_with_your_token>"
    }
  ]
```
