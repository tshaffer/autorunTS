class DesktopPlatformService {

    static getRootDirectory() : string {
        return '/Users/tedshaffer/Desktop/baconHtmlTable';
        // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
        // return '/Users/tedshaffer/Desktop/baconTestCard';
      // return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';

      // return '/storage/sd';
    }

    static getTmpDirectory() : string {
        return '/Users/tedshaffer/Desktop/baconHtmlTable';
        // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
      // return '/Users/tedshaffer/Desktop/baconTestCard';
      // return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';
      // return '/storage/sd';
    }

    static getPathToPool() : string {
        return '/Users/tedshaffer/Desktop/baconHtmlTable';
        // return '/Users/tedshaffer/Desktop/baconImagesPlusVideos';
      // return '/Users/tedshaffer/Desktop/baconTestCard';
      //   return '/Users/tedshaffer/Desktop/autorunTSFilesFromBacon';
      //   return '/sd:/';
    }

    static isTickerSupported() : boolean {
        return false;
        // return true;
    }
}

export default DesktopPlatformService;
