class DesktopPlatformService {

    static getRootDirectory() : string {
        // return '/Users/tedshaffer/Desktop/baconTestCard';
        return '/storage/sd';
    }

    static getTmpDirectory() : string {
      // return '/Users/tedshaffer/Desktop/baconTestCard';
      return '/storage/sd';
    }

    static getPathToPool() : string {
        // return '/Users/tedshaffer/Desktop/baconTestCard';
        return '/sd:/';
    }

    static isTickerSupported() : boolean {
        // return false;
        return true;
    }
}

export default DesktopPlatformService;
