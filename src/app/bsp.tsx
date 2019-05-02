import fs = require('fs');
import path = require('path');

const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

import {Store} from 'redux';

import {
  BsDeviceInfo,
  BSNetworkInterfaceConfig,
  BsRegistry,
  BsScreenshot,
  BsSize,
} from '../brightSignInterfaces';

import {
  DataFeedUsageType,
  EventType,
  GraphicsZOrderType,
  ButtonPanelName,
} from '@brightsign/bscore';

import {
  BsDmId,
  DmSignState,
  DmState,
  DmZone,
  dmOpenSign,
  dmGetZonesForSign,
  dmGetZoneById,
  dmGetDataFeedIdsForSign,
  dmGetDataFeedById,
} from '@brightsign/bsdatamodel';

import {
  ArEventType,
  ArSyncSpec,
  ArSyncSpecDownload,
  ArState,
  ArFileLUT,
} from '../types';

import PlatformService from '../platform';

import {getBrightSignObjects} from '../brightSignObjects';

import {
  setPoolAssetFiles,
} from '../utilities/utilities';

import {
  HSM,
} from '../hsm/HSM';

import {
  PlayerHSM,
} from '../hsm/playerHSM';

import {
  ZoneHSM,
} from '../hsm/zoneHSM';

import {
  MediaZoneHSM,
} from '../hsm/mediaZoneHSM';

import {
  TickerZoneHSM,
} from '../hsm/tickerZoneHSM';

import
  DataFeed
  from '../entities/dataFeed';

import
  MrssDataFeed
  from '../entities/mrssDataFeed';

import
  TextDataFeed
  from '../entities/textDataFeed';

import {
  addDataFeed
} from   '../store/dataFeeds';

let _singleton: BSP = null;

export class BSP {

  store: Store<ArState>;
  dispatch: Function;
  getState: Function;
  syncSpec: ArSyncSpec;
  autoSchedule: any;
  hsmList: HSM[];
  playerHSM: PlayerHSM;
  liveDataFeedsToDownload: DataFeed[];

  version: string;
  sysFlags: any;
  sysInfo: any;

  deviceInfo: BsDeviceInfo;
  eth0Configuration: BSNetworkInterfaceConfig;
  eth1Configuration: BSNetworkInterfaceConfig;
  edid: any;
  registry: BsRegistry;
  systemTime: any;
  controlPort: any;
  svcPort: any;
  bp900ControlPort0: any;
  expanderControlPort: any;
  lightController0ControlPort: any;
  lightController1ControlPort: any;
  lightController2ControlPort: any;
  lightController0DiagnosticsPort: any;
  lightController1DiagnosticsPort: any;
  lightController2DiagnosticsPort: any;
  screenShot: any;
  enableRemoteSnapshot: boolean;
  remoteSnapshotInterval: number;
  remoteSnapshotMaxImages: number;
  remoteSnapshotJpegQualityLevel: number;
  remoteSnapshotDisplayPortrait: boolean;
  snapshotFiles: string[];
  networkingRegistrySettings: any;
  remoteSnapshotTimerId: any;
  activePresentation: string;

  screenshot : BsScreenshot;
  videoOutput : any;
  graphicsResolution : BsSize;


  constructor() {
    if (!_singleton) {
      console.log('bsp constructor invoked');
      _singleton = this;
    }
  }

  parseNativeFiles(rootPath: string, pathToPool: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.openSyncSpec(path.join(rootPath, 'local-sync.json')).then((cardSyncSpec: ArSyncSpec) => {
        this.syncSpec = cardSyncSpec;
        const poolAssetFiles: ArFileLUT = this.buildPoolAssetFiles(this.syncSpec, pathToPool);
        setPoolAssetFiles(poolAssetFiles);
        this.getAutoschedule(this.syncSpec, rootPath).then((autoSchedule: any) => {
          this.autoSchedule = autoSchedule;
          resolve();
        });
      });
    });
  }

  initialize(reduxStore: Store<ArState>) {

    console.log('bsp initialization');

    this.store = reduxStore;
    this.dispatch = this.store.dispatch;
    this.getState = this.store.getState;

    this.version = '0.0.1';

    console.log(PlatformService);
    const rootPath = PlatformService.default.getRootDirectory();
    const pathToPool = PlatformService.default.getPathToPool();

    this.hsmList = [];

    // TODO - could be either local-sync.json or current-sync.json (others in the future?)
    const syncSpecPath = path.join(rootPath, 'local-sync.json');
    this.openSyncSpec(syncSpecPath)
      .then((cardSyncSpec: ArSyncSpec) => {
        this.syncSpec = cardSyncSpec;
        return getBrightSignObjects()
      }).then((bsObjects: any) => {
        Object.assign(this, bsObjects);
        return PlatformService.default.readRegistrySection(this.registry, 'networking')
      }).then((networkingRegistrySettings: any) => {
        this.networkingRegistrySettings = networkingRegistrySettings;
        this.setSystemInfo();
        return this.initRemoteSnapshots()
      }).then(() => {
        this.continueInit();
        return this.parseNativeFiles(rootPath, pathToPool)
      }).then(() => {
        this.launchHSM();
      });
  }

  setSystemInfo() {

    const debugParams: any = this.enableDebugging();
    this.sysFlags = {};
    this.sysFlags.debugOn = debugParams.serialDebugOn;
    this.sysFlags.systemLogDebugOn = debugParams.systemLogDebugOn;

    // TODO - better way to do this using ES6 features?
    this.sysInfo = {};
    this.sysInfo.autorunVersion = this.version;
    this.sysInfo.customAutorunVersion = this.version;   // TODO
    this.sysInfo.deviceUniqueId = this.deviceInfo.deviceUniqueId;
    this.sysInfo.deviceFWVersion = this.deviceInfo.version;
    this.sysInfo.deviceFWVersionNumber = 0; // TODO - calculate me
    this.sysInfo.deviceModel = this.deviceInfo.model;
    this.sysInfo.deviceFamily = this.deviceInfo.family;
    this.sysInfo.enableLogDeletion = true;

    this.sysInfo.ipAddressWired = 'Invalid';
    if (this.eth0Configuration) {
      // TODO - not working at home. value below is object with member 'family'
      this.sysInfo.ipAddressWired = this.eth0Configuration.ipAddressList[0];
    }

    this.sysInfo.modelSupportsWifi = false;
    this.sysInfo.ipAddressWireless = 'Invalid';
    if (this.eth1Configuration) {
      this.sysInfo.modelSupportsWifi = true;
      this.sysInfo.ipAddressWireless = this.eth1Configuration.ipAddressList[0];
    }
    // determine whether or not storage is writable
  }

  continueInit() {

    let lwsConfig = PlatformService.default.getRegistryValue(this.networkingRegistrySettings, 'nlws');

    // if the device is configured for local file networking with content transfers, require that the storage is writable
    // if BSP.registrySettings.lwsConfig$ = "c" and BSP.sysInfo.storageIsWriteProtected then DisplayStorageDeviceLockedMessage()

    let lwsEnabled = false
    if (lwsConfig === 'c' || lwsConfig === 's') {
      lwsEnabled = true;
    }



  //   if lwsEnabled then
  //
  //   BSP.localServer = CreateObject("roHttpServer", { port: 8080 })
  //   BSP.localServer.SetPort(msgPort)
  //
  //   if lwsEnabled then
  //
  //   lwsUserName$ = BSP.registrySettings.lwsUserName$
  //   lwsPassword$ = BSP.registrySettings.lwsPassword$
  //
  //   if (len(lwsUserName$) + len(lwsPassword$)) > 0 then
  //   lwsCredentials = CreateObject("roAssociativeArray")
  //   lwsCredentials.AddReplace(lwsUserName$, lwsPassword$)
  // else
  //   lwsCredentials = invalid
  //   end if
  //
  //     endif

  }

  initRemoteSnapshots(): Promise<any> {

    return new Promise((resolve, reject) => {
      // setup snapshot capability as early as possible
      this.enableRemoteSnapshot = false;

      let enableRemoteSnapshot = PlatformService.default.getRegistryValue(this.networkingRegistrySettings,
        'enableRemoteSnapshot');

      if (enableRemoteSnapshot.toLowerCase() === 'yes') {

        // if sysInfo.storageIsWriteProtected then DisplayStorageDeviceLockedMessage()

        this.enableRemoteSnapshot = true;
        this.remoteSnapshotInterval = Number(PlatformService.default.getRegistryValue(
          this.networkingRegistrySettings, 'remotesnapshotinterval'));
        this.remoteSnapshotMaxImages = Number(PlatformService.default.getRegistryValue(
          this.networkingRegistrySettings, 'remotesnapshotmaximages'));
        this.remoteSnapshotJpegQualityLevel = Number(PlatformService.default.getRegistryValue(
          this.networkingRegistrySettings, 'remotesnapshotjpegqualitylevel'));
        this.remoteSnapshotDisplayPortrait = PlatformService.default.getRegistryValue(
            this.networkingRegistrySettings, 'remotesnapshotdisplayportrait').toLowerCase() === 'true';

        const snapshotDir: string = '/storage/sd/snapshots';
        this.snapshotFiles = [];

        let snapshotDirectoryCreated = false;
        try {
          fs.mkdirSync(snapshotDir);
          snapshotDirectoryCreated = true;
        }
        catch (err) {
          console.log('mkdirSync error:');
          console.log(err);
        }

        if (!snapshotDirectoryCreated) {
          this.readDir(snapshotDir).then((filesInSnapshotDir: string[]) => {
            // snapshot files end with .jpg
            filesInSnapshotDir.forEach((snapshotFile) => {
              if (snapshotFile.endsWith('.jpg')) {
                this.snapshotFiles.push(snapshotFile);
              }
            });
            this.snapshotFiles.sort();
            resolve();
          }).catch((err) => {
            reject(err);
          });
        }
        else {
          resolve();
        }
      }
      else {
        resolve();
      }
    });
  }

  takeSnapshot(presentationName : string) : any {

    // before taking snapshot, delete the oldest if necessary
    // DeleteExcessSnapshots(globalAA)

    // remoteSnapshotDisplayPortrait: boolean;

    PlatformService.default.takeScreenshot(this.screenshot, this.videoOutput, presentationName,
      this.graphicsResolution.width, this.graphicsResolution.height, this.remoteSnapshotJpegQualityLevel,
      0).then( () => {
      console.log('return from takeSnapshot');
    }).catch( (err : any) => {
      console.log('takeSnapshot failure');
      console.log(err);
    });
  }

  initiateRemoteSnapshotTimer(): any {

    const updateInterval = this.remoteSnapshotInterval * 1000;

    this.remoteSnapshotTimerId = setInterval(() => {
      console.log('remoteSnapshotTimer: timeout occurred');

      let presentationName = '';
      if (this.activePresentation) {
        presentationName = this.activePresentation;
      }
      this.takeSnapshot(presentationName);
    }
      , updateInterval,
    );

  }

  readDir(dirname: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(dirname, function (err, files) {
        if (err) {
          reject(err);
        }
        resolve(files);
      });
    })
  }

  enableDebugging(): any {
    return {
      serialDebugOn: this.syncSpec.meta.client.enableSerialDebugging,
      systemLogDebugOn: this.syncSpec.meta.client.enableSystemLogDebugging
    };
  }


  launchHSM() {

    const bsp = this;

    let state = this.getState();

// Create player state machine
    this.playerHSM = new PlayerHSM(this, this.dispatch, this.getState, state.bsdm);

// Zone state machines are created by the Player state machine when it parses the schedule and autoplay files
    this.playerHSM.initialize();
  }

  startPlayback() {

    const bsdm: DmState = this.getState().bsdm;

    const zoneHSMs: ZoneHSM[] = [];

    const zoneIds: BsDmId[] = dmGetZonesForSign(bsdm);
    zoneIds.forEach((zoneId: BsDmId) => {

      const bsdmZone: DmZone = dmGetZoneById(bsdm, {id: zoneId});

      let zoneHSM: ZoneHSM;

      switch (bsdmZone.type) {
        case 'Ticker': {
          zoneHSM = new TickerZoneHSM(this.dispatch, this.getState, zoneId);
          break;
        }
        default: {
          zoneHSM = new MediaZoneHSM(this.dispatch, this.getState, zoneId);
          break;
        }
      }
      zoneHSMs.push(zoneHSM);
      this.hsmList.push(zoneHSM);
    });

    zoneHSMs.forEach((zoneHSM: ZoneHSM) => {
      zoneHSM.constructorFunction();
      zoneHSM.initialize();
    });
  }

  restartPlayback(presentationName: string): Promise<void> {

    console.log('restart: ', presentationName);

    const rootPath = PlatformService.default.getRootDirectory();

    return new Promise<void>((resolve: Function) => {

      // TODO - only a single scheduled item is currently supported
      const scheduledPresentation = this.autoSchedule.scheduledPresentations[0];
      const presentationToSchedule = scheduledPresentation.presentationToSchedule;
      const presentationName = presentationToSchedule.name;

      const autoplayFileName = presentationName + '.bml';
      this.getSyncSpecReferencedFile(autoplayFileName, this.syncSpec, rootPath).then((bpfxState: any) => {
        console.log(bpfxState);
        const autoPlay : any = bpfxState.bsdm;
        const signState = autoPlay as DmSignState;
        // const signState = autoPlay.bsdm as DmSignState;
        this.dispatch(dmOpenSign(signState));

        this.getDataFeeds();
        resolve();
      });

    });
  }

  getDataFeeds() {
    const bsdm: DmState = this.getState().bsdm;
    const dataFeedIds: BsDmId[] = dmGetDataFeedIdsForSign(bsdm);
    dataFeedIds.forEach((dataFeedId: BsDmId) => {
      const dmDataFeed = dmGetDataFeedById(bsdm, {id: dataFeedId});

      if (dmDataFeed.usage === DataFeedUsageType.Mrss) {
        const dataFeed: MrssDataFeed = new MrssDataFeed(dmDataFeed);
        this.dispatch(addDataFeed(dataFeed));
      } else if (dmDataFeed.usage === DataFeedUsageType.Text) {
        const dataFeed: TextDataFeed = new TextDataFeed(dmDataFeed);
        this.dispatch(addDataFeed(dataFeed));
      } else {
        debugger;
      }
    });
  }

  dispatchPostMessage(event : ArEventType): void {
    this.store.dispatch(this.postMessage(event));
  }

  postMessage(event: ArEventType): () => void {
    return () => {
      this.dispatchEvent(event);
    };
  }

  dispatchEvent(event: ArEventType) {

    this.playerHSM.Dispatch(event);

    this.hsmList.forEach((hsm) => {
      hsm.Dispatch(event);
    });
  }

  getAutoschedule(syncSpec: ArSyncSpec, rootPath: string) {
    return this.getSyncSpecReferencedFile('autoschedule.json', syncSpec, rootPath);
  }

  openSyncSpec(filePath: string = ''): Promise<ArSyncSpec> {

    return new Promise<ArSyncSpec>((resolve: Function, reject: Function) => {

      fs.readFile(filePath, (err: Error, dataBuffer: Buffer) => {

        if (err) {
          reject(err);
        } else {
          const syncSpecStr: string = decoder.write(dataBuffer);
          const syncSpec: ArSyncSpec = JSON.parse(syncSpecStr);
          resolve(syncSpec);
        }
      });
    });
  }

  // Gets a file referenced by a syncSpec, not an actual sync spec
  getSyncSpecReferencedFile(fileName: string, syncSpec: ArSyncSpec, rootPath: string): Promise<object> {

    return new Promise<object>((resolve: Function, reject: Function) => {

      const syncSpecFile: ArSyncSpecDownload = this.getFile(syncSpec, fileName);
      if (syncSpecFile == null) {
        debugger;
        // syncSpecFile = { };    // required to eliminate flow warnings
      }

      // const fileSize = syncSpecFile.size;
      const filePath: string = path.join(rootPath, syncSpecFile.link);

      fs.readFile(filePath, (err: Error, dataBuffer: Buffer) => {
        if (err) {
          reject(err);
        } else {
          const fileStr: string = decoder.write(dataBuffer);
          const file: object = JSON.parse(fileStr);

          // I have commented out the following code to allow hacking of files -
          // that is, overwriting files in the pool without updating the sync spec with updated sha1
          // if (fileSize !== fileStr.length) {
          //   debugger;
          // }
          resolve(file);
        }
      });
    });
  }

  getFile(syncSpec: ArSyncSpec, fileName: string): ArSyncSpecDownload {

    let file: ArSyncSpecDownload = null;

    syncSpec.files.download.forEach((syncSpecFile: ArSyncSpecDownload) => {
      if (syncSpecFile.name === fileName) {
        file = syncSpecFile;
        return;
      }
    });

    return file;
  }

  buildPoolAssetFiles(syncSpec: ArSyncSpec, pathToPool: string): ArFileLUT {

    const poolAssetFiles: ArFileLUT = {};

    syncSpec.files.download.forEach((syncSpecFile: ArSyncSpecDownload) => {
      poolAssetFiles[syncSpecFile.name] = path.join(pathToPool, syncSpecFile.link);
    });

    return poolAssetFiles;
  }

  queueRetrieveLiveDataFeed(dataFeed: DataFeed) {

    const liveDataFeed = dataFeed;

    // if (liveDataFeed.usage === DataFeedUsageType.Text) {
    //   dataFeed.retrieveFeed(this);
    // } else {
    //   // is the following correct? check with autorun classic
    //   this.liveDataFeedsToDownload.push(liveDataFeed);
    //
    //   // launch download of first feed
    //   if (this.liveDataFeedsToDownload.length === 1) {
    //     dataFeed.retrieveFeed(this);
    //   }
    // }
  }

}

export const bsp = new BSP();
