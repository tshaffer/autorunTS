class DesktopPlatformService {

  // static srcDirectory = '/Users/tedshaffer/Desktop/aaa_bac';            // bac classic files - for import
  static srcDirectory = '/Users/tedshaffer/Desktop/baconTestCard';   // bacon files - for non import

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
}

export default DesktopPlatformService;
