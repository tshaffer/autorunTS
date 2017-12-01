// const os = require('os');
import os = require('os');

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
  BSInterfaceTestResult,
  BsLog,
  BSNetworkInterfaceConfig,
  BsRegistry,
  BsScreenshot,
  BsScreenshotParams,
  BsSize,
} from '../../brightSignInterfaces';

class BrightSignPlatformService extends APlatformService {

  static initialize() : void {
    console.log('BrightSignPlatformService.initialize()');
  }

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
  // current getCurrentConfig() function returns what is documented at
  //    http://docs.brightsign.biz/display/DOC/roNetworkConfiguration#roNetworkConfiguration-GetCurrentConfig()AsObject
  /*
   export interface BSNetworkInterfaceConfig {
   metric : number;
   dhcpServerConfig : any;
   dnsServerList : string[];
   ipAddressList : any[];
   inboundShaperRate : number;
   mut: number;
   vlanIdList : number[];
   clientIdentifier : string;
   domain : string;
   }
  */

  // TODO - integrate properly
  static getHostConfiguration() {
    return new Promise( (resolve, reject) => {

      const HostConfiguration = require("@brightsign/hostconfiguration");
      const hc = new HostConfiguration();

      hc.getConfig().then((hostConfig : any) => {
        console.log('hostConfig configuration: ');
        console.log(hostConfig);
        resolve();
      }).catch( (err : any) => {
        console.log('hostConfig err: ');
        console.log(err);
        reject(err);
      })
    });
  }



  static getNetworkConfiguration(networkInterface : string) : Promise<BSNetworkInterfaceConfig> {

    let networkInterfaceInfo : any = {};

    return new Promise( (resolve, reject) => {

      // retrieve network interfaces from node
      const networkInterfaces : any = os.networkInterfaces();

      if (networkInterfaces[networkInterface]) {
        const selectedNetworkInterfaces : any = networkInterfaces[networkInterface];
        selectedNetworkInterfaces.forEach( (selectedNetworkInterface : any) => {
          if (selectedNetworkInterface.family.toLowerCase() === 'ipv4' && !selectedNetworkInterface.internal) {
            networkInterfaceInfo = {
              address : selectedNetworkInterface.address,
              netmask : selectedNetworkInterface.netmask,
              mac : selectedNetworkInterface.mac
            }
          }
        });
      }

      const NetworkInterface = require("@brightsign/networkconfiguration");
      const nc = new NetworkInterface(networkInterface);
      nc.getConfig().then((networkConfig : BSNetworkInterfaceConfig) => {
        // if (networkConfig && networkConfig.domain === 'brightsign') {
        if (networkConfig && networkConfig.clientIdentifier.startsWith('BrightSign')) {
          Object.assign(networkConfig, networkInterfaceInfo);
          // resolve(networkConfig);
          console.log('getNetworkConfiguration for: ', networkInterface, ' is: ');
          console.log(networkConfig);

          resolve(networkConfig);

          // const NetworkDiagnosticsClass = require("@brightsign/networkdiagnostics");
          // const nd = new NetworkDiagnosticsClass();
          // nd.testInternetConnectivity(networkInterface).then((data : any) => {
          //
          //   console.log(JSON.stringify(data));
          //
          //   const bsInterfaceTestResult : BSInterfaceTestResult = data as BSInterfaceTestResult;
          //   console.log('BSInterfaceTestResult');
          //   console.log('ok: ', bsInterfaceTestResult.ok);
          //   console.log('diagnosis: ', bsInterfaceTestResult.diagnosis);
          //   console.log('logs');
          //   bsInterfaceTestResult.log.forEach( (bsLog : BsLog) => {
          //     console.log('    log:');
          //     console.log('       name: ', bsLog.name);
          //     console.log('       pass: ', bsLog.pass);
          //     console.log('       result: ', bsLog.result);
          //     if (bsLog.info) {
          //       console.log('       info: ', bsLog.info);
          //     }
          //   });
          //
          //   resolve(networkConfig);
          // });
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

  // 	BSP.bpInputPorts[0] = CreateObject("roControlPort", "TouchBoard-0-GPIO")
  // static getBP900ControlPort(portNumber : number) : any {
  //   return new Promise( (resolve : any) => {
  //     let controlPort : any = null;
  //     const controlPortSpec : string = 'TouchBoard-' + portNumber.toString() + '-GPIO';
  //     try {
  //       controlPort = new BSControlPort(controlPortSpec);
  //     }
  //     catch (e) {
  //       console.log('failed to create controlPort: ' + controlPortSpec);
  //     }
  //     resolve(controlPort);
  //   });
  // }

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

        // TODO - won't always be 'sd'
        const screenshotParams : BsScreenshotParams = {
          fileName : 'sd:/snapshots/' + isoDateTime + '.jpg',
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

  static getRegistryValue(registrySection : any, key : string) : string {
    return registrySection[key.toLowerCase()];
  }

}

export default BrightSignPlatformService;
