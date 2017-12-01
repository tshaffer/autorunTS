import {
  BsDeviceInfo,
  BSNetworkInterfaceConfig,
  BsRegistry,
  BsScreenshot,
  BsScreenshotParams,
  BsSize,
} from '../../brightSignInterfaces';

class DesktopPlatformService {

  // static srcDirectory = '/Users/tedshaffer/Desktop/aaa_bac';            // bac classic files - for import
  // static srcDirectory = '/Users/tedshaffer/Desktop/baconTestCard';   // bacon files - for non import
  // static srcDirectory = '/Users/tedshaffer/Desktop/baconImportFromBac';   // bacon import from bac
  // static srcDirectory = '/Users/tedshaffer/Desktop/ab';   // importable component for now
  // static srcDirectory = '/Users/tedshaffer/Desktop/baconPluginPresentation';   // importable component for now
  // static srcDirectory = '/Users/tedshaffer/Desktop/autorunTs';   // bacon files - nonImport
  // static srcDirectory = '/Users/tedshaffer/Desktop/autorunTsInteractivity';
  static srcDirectory = '/Users/tedshaffer/Desktop/bacInteractive/publish';

  static getRootDirectory(): string {
    return DesktopPlatformService.srcDirectory;
    // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
    // return '/Users/tedshaffer/Desktop/baconTestCard';
    // return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';

    // return '/storage/sd';
  }

  static getTmpDirectory(): string {
    return DesktopPlatformService.srcDirectory;
    // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
    // return '/Users/tedshaffer/Desktop/baconTestCard';
    // return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';
    // return '/storage/sd';
  }

  static getPathToPool(): string {
    return DesktopPlatformService.srcDirectory;
    // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
    // return '/Users/tedshaffer/Desktop/baconTestCard';
    //   return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';
    //   return '/sd:/';
  }

  static isTickerSupported(): boolean {
    return false;
    // return true;
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

}

export default DesktopPlatformService;
