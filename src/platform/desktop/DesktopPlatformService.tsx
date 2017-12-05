import {
  BsDeviceInfo,
  BSNetworkInterfaceConfig,
  BsRegistry,
  BsScreenshot,
  BsScreenshotParams,
  BsSize,
} from '../../brightSignInterfaces';

import {
  EventType,
  ButtonPanelName,
} from '@brightsign/bscore';

import {
  ArEventType,
} from '../../types/index';


import { bsp, BSP } from '../../app/bsp';

const http = require('http');
const url = require('url');
const querystring = require('querystring');

const srcDirectory = '/Users/tedshaffer/Desktop/bacInteractive/publish';

class DesktopPlatformService {

  static initialize() : void {

    console.log('DesktopPlatformService.initialize()');

    const port = 3000;

    const simulatedEventHandler = (request: any, response: any) => {

      const rawUrl : string = request.url;
      console.log('rawUrl: ', rawUrl);

      const parsedUrl = url.parse(rawUrl);
      console.log('parsedUrl: ', parsedUrl);

      const parsedQs = querystring.parse(parsedUrl.query);
      console.log('parsedQs: ', parsedQs);

      const commandStr : string = parsedQs.command;
      console.log(commandStr);
      const command : any = JSON.parse(commandStr);
      console.log(command);
      DesktopPlatformService.processInputEvent(command);
      // const command : string = request.url.substr(1);
      // response.end('Received request: ' + command);
      //
      // DesktopPlatformService.processBpEvent();
    }

    // https://blog.risingstack.com/your-first-node-js-http-server/
    const simulatedEventServer = http.createServer(simulatedEventHandler);
    simulatedEventServer.listen(port, (err: any) => {
      if (err) {
        return console.log('Error launching simulatedEventServer', err);
      }
      console.log(`simulatedEventServer is listening on ${port}`);
    });
  }

  static getButtonPanelName(bpParameters : any) : ButtonPanelName {
    switch (bpParameters.buttonPanelType) {
      case 'bp900': {
        switch (bpParameters.buttonPanelIndex) {
          case 0: {
            return ButtonPanelName.Bp900a;
          }
          case 1: {
            return ButtonPanelName.Bp900b;
          }
        }
        break;
      }
      case 'bp200': {
        break;
      }
    }
  }

  static processInputEvent(inputEvent : any) {
    switch (inputEvent.command) {
      case 'bp': {
        // send command:  {"command":"bp","parameters":{"buttonPanelType":"bp900","buttonPanelIndex":0,"buttonNumber":7}}
        const bpParameters : any = inputEvent.parameters;
        const buttonPanelName = DesktopPlatformService.getButtonPanelName(bpParameters);
        const event: ArEventType = {
          EventType: EventType.Bp,
          EventData: {
            ButtonPanelName: buttonPanelName,
            ButtonIndex: bpParameters.buttonNumber
          }
        };
        bsp.dispatchPostMessage(event);    
      }
    }
  }

  // static processBpEvent() {
  //   const event: ArEventType = {
  //     EventType: EventType.Bp,
  //     EventData: {
  //       ButtonPanelName: ButtonPanelName.Bp900a,
  //       ButtonIndex: 0
  //     }
  //   };

  //   bsp.dispatchPostMessage(event);
  // }

  static getRootDirectory(): string {
    return srcDirectory;
  }

  static getTmpDirectory(): string {
    return srcDirectory;
  }

  static getPathToPool(): string {
    return srcDirectory;
  }

  static isTickerSupported(): boolean {
    return false;
  }

  static getDeviceInfo(): any {
    return {
      deviceUniqueId: 'SerialNumber69',
      deviceFWVersion: '7.0.0',
      deviceFWVersionNumber: 77000,
      deviceModel: 'XT1143',
      deviceFamily: 'Impala'
    };
  }

  static readRegistry(sectionName: string, key?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  static writeRegistry(sectionName: string, key: string, value: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  static getRegistry(): BsRegistry {
    const bsRegistry: BsRegistry = {
      read: DesktopPlatformService.readRegistry,
      write: DesktopPlatformService.writeRegistry
    };
    return bsRegistry;
  }

  static getVideoOutput(videoConnector: string): any {
    return {};
  }

  static getSystemTime(): any {
    return {};
  }

  static getScreenshot(): any {
    return {};
  }

  static getNetworkConfiguration(networkInterface : string) : Promise<BSNetworkInterfaceConfig> {

    return new Promise( (resolve) => {
      resolve({
          metric : 0,
          dhcpServerConfig : {},
          dnsServerList :[],
          ipAddressList : [],
          inboundShaperRate : 0,
          mut: 0,
          vlanIdList : [],
          clientIdentifier : '',
          domain : '',
        });
    });
  }

  static getEdid(videoOutputObj : any) : any {
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }

  static getControlPort(portName : string) : any {
    return new Promise( (resolve : any) => {
      resolve(null);
    });
  }

  static getGraphicsResolution(videoOutputObj : any) : Promise<BsSize> {
    return new Promise( (resolve, reject) => {
      resolve(
        {
          width: 1920,
          height: 1080
        }
      );
    });
  }

  static deviceHasGpioConnector(deviceInfo : any) : boolean {
    return true;
  }

  static readRegistrySection(registry : BsRegistry, registrySection : string) : Promise<string> {
    return new Promise( (resolve) => {
      resolve('');
    });
  }

  static getRegistryValue(registrySection : any, key : string) : string {
    return '';
  }

  static addEventHandlers(bsp: BSP) : void {
    console.log('DesktopPlatformService: add eventHandlers');
  }

}

export default DesktopPlatformService;
