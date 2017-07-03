import fs = require('fs');
import path = require('path');

const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

import {Store} from 'redux';

import {
  DataFeedUsageType, GraphicsZOrderType,
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
  dmGetSignState,
} from '@brightsign/bsdatamodel';

import {
  ArEventType,
  ArSyncSpec,
  ArSyncSpecDownload,
  ArState,
  ArFileLUT,
} from '../types';

import PlatformService from '../platform';

import {
  importPublishedFiles,
} from '../ba-importer/importer';

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
  autoSchedule : any;
  hsmList: HSM[];
  playerHSM: PlayerHSM;
  liveDataFeedsToDownload: DataFeed[];
  importPublishedFiles : boolean;

  constructor() {
    if (!_singleton) {
      console.log('bsp constructor invoked');
      _singleton = this;
    }
  }

  parseImportedPublishedFiles(rootPath : string, pathToPool : string): Promise<any> {
    return new Promise( (resolve, reject) => {
      importPublishedFiles(rootPath, this.dispatch, this.getState).then( (convertedPackage : any) => {
        // autoplay results have been written to redux store.
        this.syncSpec = convertedPackage.syncSpec;
        this.autoSchedule = convertedPackage.autoSchedule;
        const poolAssetFiles: ArFileLUT = this.buildPoolAssetFiles(this.syncSpec, pathToPool);
        setPoolAssetFiles(poolAssetFiles);
        resolve();
      });
    });
  }

  parseNativeFiles(rootPath : string, pathToPool : string) : Promise<any> {
    return new Promise( (resolve, reject) => {
      this.openSyncSpec(path.join(rootPath, 'local-sync.json')).then((cardSyncSpec: ArSyncSpec) => {
        this.syncSpec = cardSyncSpec;
        const poolAssetFiles: ArFileLUT = this.buildPoolAssetFiles(this.syncSpec, pathToPool);
        setPoolAssetFiles(poolAssetFiles);
        this.getAutoschedule(this.syncSpec, rootPath).then((autoSchedule: any) => {
          this.autoSchedule = autoSchedule;
          resolve();
          this.launchHSM();
        });
      });
    });
  }

  initialize(reduxStore: Store<ArState>) {

    console.log('bsp initialization');

    this.store = reduxStore;
    this.dispatch = this.store.dispatch;
    this.getState = this.store.getState;
    this.hsmList = [];

    console.log(PlatformService);
    const rootPath = PlatformService.default.getRootDirectory();
    const pathToPool = PlatformService.default.getPathToPool();

    this.importPublishedFiles = false;

    if (this.importPublishedFiles) {
      this.parseImportedPublishedFiles(rootPath, pathToPool).then( () => {
        this.launchHSM();
      });
    }
    else {
      this.parseNativeFiles(rootPath, pathToPool).then( () => {
        this.launchHSM();
      });
    }
  }

  launchHSM() {

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

        if (!this.importPublishedFiles) {
          const autoplayFileName = presentationName + '.bml';
          this.getSyncSpecReferencedFile(autoplayFileName, this.syncSpec, rootPath).then((autoPlay: object) => {
            console.log(autoPlay);
            const signState = autoPlay as DmSignState;
            this.dispatch(dmOpenSign(signState));
            this.getDataFeeds();
            resolve();
          });

        }
        else {
          const signState : DmSignState = dmGetSignState(this.getState().bsdm);
          this.dispatch(dmOpenSign(signState));
          this.getDataFeeds();
          resolve();
        }
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

    if (liveDataFeed.usage === DataFeedUsageType.Text) {
      dataFeed.retrieveFeed(this);
    } else {
      // is the following correct? check with autorun classic
      this.liveDataFeedsToDownload.push(liveDataFeed);

      // launch download of first feed
      if (this.liveDataFeedsToDownload.length === 1) {
        dataFeed.retrieveFeed(this);
      }
    }
  }

}

export const bsp = new BSP();
