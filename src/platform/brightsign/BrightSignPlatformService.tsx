declare class BSControlPort {
  constructor(portName : string);
}
declare class BSDeviceInfo {
  // new(): BSDeviceInfo;
  constructor();
  model: string;
  version : string;
  deviceUptime : number;
  deviceLifetime : number;
  deviceBootCount : number;
  bootVersion : string;
  deviceUniqueId : string;
  family : string;
}

import APlatformService from '../APlatformService';

import {
  BsDeviceInfo,
  BSNetworkInterfaceConfig,
  BsRegistry,
  BsScreenshot,
  BsScreenshotParams,
  BsSize,
} from '../../brightSignInterfaces';

class BrightSignPlatformService extends APlatformService {

  static getRootDirectory() {
    return '/storage/sd';
  }

  static getPathToPool() {
    return '/sd:/';
  }

  static isTickerSupported() {
    return true;
  }

  // TODO - FIXME
  getHtmlSiteUrl(site : any) {
    console.log(site);
    return 'pool/test.html';
  }

  // http://docs.brightsign.biz/display/DOC/BSDeviceInfo
  static getDeviceInfo() : BsDeviceInfo {
    return new BSDeviceInfo();
  }

  // Bug 28331 - Document @brightsign/registry Javascript object
  static getRegistry() : BsRegistry {
    const RegistryClass = require("@brightsign/registry");
    return new RegistryClass();
  }

  // Bug 28253 - Document @brightsign/systemtime Javascript object roSystemTime
  static getSystemTime() : any {
    const SystemTimeClass = require("@brightsign/systemtime");
    return new SystemTimeClass();
  }

  // Bug 28248 - Document @brightsign/networkconfiguration Javascript object
  static getNetworkConfiguration(networkInterface : string) : Promise<BSNetworkInterfaceConfig> {
    return new Promise( (resolve, reject) => {
      const NetworkInterface = require("@brightsign/networkconfiguration");
      const nc = new NetworkInterface(networkInterface);
      nc.getConfig().then((networkConfig : BSNetworkInterfaceConfig) => {
        if (networkConfig && networkConfig.domain === 'brightsign') {
          console.log('received networkConfig');
          resolve(networkConfig);
        }
        else {
          reject();
        }
      });
    });
  }

  // Bug 28332 - Document @brightsign/videooutput Javascript object
  static getVideoOutput(videoConnector : string) : any {
    const VideoOutput = require('@brightsign/videooutput');
    return new VideoOutput(videoConnector);
  }

  static getGraphicsResolution(videoOutputObj : any) : Promise<BsSize> {
    return videoOutputObj.getGraphicsResolution();
  }

  static getEdid(videoOutputObj : any) : any {
    return new Promise( (resolve, reject) => {

      // videoOutputObj.getEdidIdentity().then( (edidIdentity: any) => {
      //   console.log(edidIdentity);
      //   resolve(edidIdentity);
      //
      // }).catch( (err : any) => {
      //   reject(err);
      // });


      // voc.getEdid().then((monitorEdid: any) => {
      //   console.log('received edid');
      //   resolve(monitorEdid);
      // });


      resolve('');

    });


  }

  static getControlPort(portName : string) : any {
    return new Promise( (resolve : any) => {
      let controlPort : any = null;
      try {
        controlPort = new BSControlPort(portName);
      }
      catch (e) {
        console.log('failed to create controlPort: ');
        console.log(portName);
      }
      resolve(controlPort);
    });
  }

  static deviceHasGpioConnector(deviceInfo : any) : boolean {
    return (deviceInfo.HasFeature('GPIO Connector'));
  }

  // Bug 28625 - Document @brightsign/screenshot Javascript object
  static getScreenshot() : any {
    const ScreenShot = require('@brightsign/screenshot');
    return new ScreenShot();
  }

  static takeScreenshot(screenshot : BsScreenshot, videoOutput : any, presentationName : string, width : number,
                        height : number, quality : number, rotation : number) : Promise<any> {

    return new Promise( (resolve, reject) => {

      // TODO is this local time?
      // create a file name based on the current date/time
      const isoDateTime = BrightSignPlatformService.getIsoDateTime();

      BrightSignPlatformService.getGraphicsResolution(videoOutput).then( (graphicsResolution : BsSize) => {

        const screenshotParams : BsScreenshotParams = {
          fileName : '/storage/sd/snapshots/' + isoDateTime + ".jpg",
          fileType : 'JPEG',
          description : presentationName,
          width : graphicsResolution.width,
          height : graphicsResolution.height,
          quality,
          rotation,
        };

        screenshot.asyncCapture(screenshotParams).then( () => {
          resolve();
        }).catch( (err) => {
          console.log('asyncCapture failure:');
          console.log(err);
          reject(err);
        })
      });
    });
  }

  static getIsoDateTime() : string {
    const currentTime = new Date();
    let isoDateTime = currentTime.toISOString();
    isoDateTime = BrightSignPlatformService.replaceAll(isoDateTime, '-', '');
    isoDateTime = BrightSignPlatformService.replaceAll(isoDateTime, ':', '');
    const lastIndexOfDot : number = isoDateTime.lastIndexOf('.');
    isoDateTime = isoDateTime.substr(0, lastIndexOfDot);
    return isoDateTime;
  }

  static replaceAll(inputValue : string, search : string, replacement : string) {
    return inputValue.replace(new RegExp(search, 'g'), replacement);
  };

  static readRegistryValue(registry : BsRegistry, registrySection : string, key : string) : Promise<string> {
    return new Promise( (resolve, reject) => {
      registry.read(registrySection, key).then( (keyValue : string) => {
        resolve(keyValue);
      }).catch (( err : any) => {
        reject(err);
      });
    })
  }

  static readRegistrySection(registry : BsRegistry, registrySection : string) : Promise<string> {
    return new Promise( (resolve, reject) => {
      registry.read(registrySection).then( (keyValue : string) => {
        resolve(keyValue);
      }).catch (( err : any) => {
        reject(err);
      });
    })
  }
}

export default BrightSignPlatformService;
