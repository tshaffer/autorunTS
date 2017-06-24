import fs = require('fs');
import path = require('path');

const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

import {Store} from 'redux';

import {
  DataFeedUsageType, GraphicsZOrderType,
} from '@brightsign/bscore';

import {
  DeviceWebPageDisplay,
  LanguageKeyType,
  LanguageType,
  MonitorOrientationType,
  MonitorOverscanType,
  TouchCursorDisplayModeType,
  UdpAddressType,
  VideoConnectorType,
  BsColor,
} from '@brightsign/bscore';

import {
  dmGetSignState,
  dmNewSign, DmSignMetadata, DmSignProperties,
  dmUpdateSignProperties,
  SignAction,
} from '@brightsign/bsdatamodel';

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
} from '../store/dataFeeds';

let _singleton: BSP = null;

export class BSP {

  store: Store<ArState>;
  dispatch: Function;
  getState: Function;
  syncSpec: ArSyncSpec;
  hsmList: HSM[];
  playerHSM: PlayerHSM;
  liveDataFeedsToDownload: DataFeed[];

  constructor() {
    if (!_singleton) {
      console.log('bsp constructor invoked');
      _singleton = this;
    }
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

    let state: ArState;

    this.openSyncSpec(path.join(rootPath, 'local-sync.json')).then((cardSyncSpec: ArSyncSpec) => {

      console.log(cardSyncSpec);

      this.syncSpec = cardSyncSpec;

      // FileNameToFilePathLUT
      const poolAssetFiles: ArFileLUT = this.buildPoolAssetFiles(this.syncSpec, pathToPool);
      console.log(poolAssetFiles);

      setPoolAssetFiles(poolAssetFiles);

      state = this.store.getState();

// Create player state machine
      this.playerHSM = new PlayerHSM(this, this.dispatch, this.getState, state.bsdm);

// Zone state machines are created by the Player state machine when it parses the schedule and autoplay files
      this.playerHSM.initialize();

    }).catch((err: Error) => {
      console.log(err);
      debugger;
    });
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
      this.getAutoschedule(this.syncSpec, rootPath).then((autoSchedule: any) => {

        // TODO - only a single scheduled item is currently supported

        const scheduledPresentation = autoSchedule.scheduledPresentations[0];
        const presentationToSchedule = scheduledPresentation.presentationToSchedule;
        const presentationName = presentationToSchedule.name;

        // for bacon
        // const autoplayFileName = presentationName + '.bml';
        // for bac
        const autoplayFileName = 'autoplay-' + presentationName + '.json';
        this.getSyncSpecFile(autoplayFileName, this.syncSpec, rootPath).then((autoPlay: object) => {
          console.log(autoPlay);

          autoPlay = this.convertAutoplay(autoPlay);

          const signState = autoPlay as DmSignState;
          this.dispatch(dmOpenSign(signState));

          // get data feeds for the sign
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

          resolve();
        });
      });
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
    // return this.getSyncSpecFile('autoschedule.json', syncSpec, rootPath);

    return new Promise( (resolve) => {
      this.getSyncSpecFile('autoschedule.json', syncSpec, rootPath).then( (autoScheduleBac) => {
        const autoSchedule = this.convertAutoschedule(autoScheduleBac);
        resolve(autoSchedule);
      });
    });
  }

  convertAutoschedule(autoScheduleBac : any) : any {

    // only works now for a single scheduledPresentation
    let scheduledPresentation : any = {};
    let rawScheduledPresentation : any = autoScheduleBac.autoschedule.scheduledPresentation;
    scheduledPresentation.allDayEveryDay = (rawScheduledPresentation.allDayEveryDay.toLowerCase() === 'true');
    scheduledPresentation.dateTime = rawScheduledPresentation.dateTime;
    scheduledPresentation.duration = Number(rawScheduledPresentation.duration);
    scheduledPresentation.interruption = (rawScheduledPresentation.interruption.toLowerCase() === 'true');
    scheduledPresentation.presentationToSchedule = {
      fileName: rawScheduledPresentation.presentationToSchedule.fileName,
      filePath: rawScheduledPresentation.presentationToSchedule.filePath,
      name: rawScheduledPresentation.presentationToSchedule.name,
    };
    scheduledPresentation.recurrence = (rawScheduledPresentation.recurrence.toLowerCase() === 'true');
    scheduledPresentation.recurrenceEndDate = rawScheduledPresentation.recurrenceEndDate;
    scheduledPresentation.recurrenceGoesForever = (rawScheduledPresentation.recurrenceGoesForever.toLowerCase() === 'true');
    scheduledPresentation.recurrencePattern = rawScheduledPresentation.recurrencePattern;
    scheduledPresentation.recurrencePatternDaily = rawScheduledPresentation.recurrencePatternDaily;
    scheduledPresentation.recurrencePatternDaysOfWeek = Number(rawScheduledPresentation.recurrencePatternDaysOfWeek);
    scheduledPresentation.recurrenceStartDate = rawScheduledPresentation.recurrenceStartDate;

    let autoSchedule : any = {};
    autoSchedule.scheduledPresentations = [scheduledPresentation];
    return autoSchedule;
  }

  stringToBool(s : string) : boolean {
    return (s.toLowerCase() === 'true');
  }

  stringToNumber(s : string) : number {
    return (Number(s));
  }

  convertAutoplay(autoplayBac : any) : DmSignState {
    let signAction : SignAction;
    let signState : DmSignState;
    let signMetadata : DmSignMetadata;
    let signProperties : DmSignProperties;
    
    const meta = autoplayBac.BrightAuthor.meta;

    signAction = this.dispatch(dmNewSign(meta.name, meta.videoMode, meta.model));

    let state = this.getState();

    signState = dmGetSignState(state.bsdm);
    signMetadata = signState.sign;
    signProperties = signMetadata.properties;

    const alphabetizeVariableNames : boolean = this.stringToBool(meta.alphabetizeVariableNames);
    const autoCreateMediaCounterVariables : boolean = this.stringToBool(meta.autoCreateMediaCounterVariables);
    const backgroundScreenColor : BsColor = {
      a: this.stringToNumber(meta.backgroundScreenColor['@a']),
      r: this.stringToNumber(meta.backgroundScreenColor['@a']),
      g: this.stringToNumber(meta.backgroundScreenColor['@a']),
      b: this.stringToNumber(meta.backgroundScreenColor['@a']),
    };
    const delayScheduleChangeUntilMediaEndEvent : boolean = this.stringToBool(meta.delayScheduleChangeUntilMediaEndEvent.toLowerCase());
    const deviceWebPageDisplay : DeviceWebPageDisplay = meta.deviceWebPageDisplay;
    const flipCoordinates : boolean =  this.stringToBool(meta.flipCoordinates);
    const forceResolution : boolean = this.stringToBool(meta.forceResolution);
    const graphicsZOrder : GraphicsZOrderType = meta.graphicsZOrder;
    const htmlEnableJavascriptConsole : boolean = this.stringToBool(meta.htmlEnableJavascriptConsole);
    const inactivityTime : number = this.stringToNumber(meta.inactivityTime);
    const inactivityTimeout : boolean = this.stringToBool(meta.inactivityTimeout);
    const isMosaic : boolean = this.stringToBool(meta.isMosaic);
    const language : LanguageType = meta.language;
    const languageKey : LanguageKeyType = meta.languageKey;
    const monitorOrientation : MonitorOrientationType = meta.monitorOrientation;
    const monitorOverscan : MonitorOverscanType = meta.monitorOverscan;
    const resetVariablesOnPresentationStart : boolean = this.stringToBool(meta.resetVariablesOnPresentationStart);
    const tenBitColorEnabled : boolean = this.stringToBool(meta.tenBitColorEnabled);
    const touchCursorDisplayMode : TouchCursorDisplayModeType = meta.touchCursorDisplayMode;
    const udpDestinationAddress : string = meta.udpDestinationAddress;
    const udpDestinationAddressType : UdpAddressType = meta.udpDestinationAddressType;
    const udpDestinationPort : number = this.stringToNumber(meta.udpDestinationPort);
    const udpReceiverPort : number = this.stringToNumber(meta.udpReceiverPort);
    const videoConnector : VideoConnectorType = meta.videoConnector;

    signAction = this.dispatch(dmUpdateSignProperties(
      {
        id : signProperties.id,
        alphabetizeVariableNames,
        autoCreateMediaCounterVariables,
        backgroundScreenColor,
        delayScheduleChangeUntilMediaEndEvent,
        deviceWebPageDisplay,
        flipCoordinates,
        forceResolution,
        graphicsZOrder,
        htmlEnableJavascriptConsole,
        inactivityTime,
        inactivityTimeout,
        isMosaic,
        language,
        languageKey,
        monitorOrientation,
        monitorOverscan,
        resetVariablesOnPresentationStart,
        tenBitColorEnabled,
        touchCursorDisplayMode,
        udpDestinationAddress,
        udpDestinationAddressType,
        udpDestinationPort,
        udpReceiverPort,
        videoConnector,
      })
    );

    state = this.getState();

    debugger;

    return signState;
  }

  convertSyncSpec(syncSpecRaw : any) : ArSyncSpec {

    let syncSpec : ArSyncSpec = {
      meta : {},
      files : {}
    };

    syncSpec.meta = {};
    syncSpec.meta.server = {};

    let client : any = {};
    let clientKeys : Array<string> = [
      'diagnosticLoggingEnabled',
      'enableSerialDebugging',
      'enableSystemLogDebugging',
      'eventLoggingEnabled',
      'limitStorageSpace',
      'playbackLoggingEnabled',
      'stateLoggingEnabled',
      'uploadLogFilesAtBoot',
      'uploadLogFilesAtSpecificTime',
      'uploadLogFilesTime',
      'variableLoggingEnabled'
    ]
    for (let clientKey of clientKeys) {
      client[clientKey] = syncSpecRaw.sync.meta.client[clientKey];
    }
    // TODO - some of these types are WRONG
    syncSpec.meta.client = client;

    syncSpec.files = {};

    syncSpec.files.delete = syncSpecRaw.sync.files.delete;

    syncSpec.files.ignore = syncSpecRaw.sync.files.ignore;

    syncSpec.files.download = [];

    syncSpecRaw.sync.files.download.forEach( (downloadRaw : any) => {
      let download : any = {};
      download.link = downloadRaw.link;
      download.name = downloadRaw.name;
      download.size = Number(downloadRaw.size);
      download.hash = {};
      download.hash.hex = downloadRaw.hash['#text'];
      download.hash.method = downloadRaw.hash['@method'];

      syncSpec.files.download.push(download);
    });

    return syncSpec;
  }

  openSyncSpec(filePath: string = ''): Promise<ArSyncSpec> {

    return new Promise<ArSyncSpec>((resolve: Function, reject: Function) => {

      fs.readFile(filePath, (err: Error, dataBuffer: Buffer) => {

        if (err) {
          reject(err);
        } else {
          const syncSpecStr: string = decoder.write(dataBuffer);
          const syncSpecBac : any = JSON.parse(syncSpecStr);

          // TODO - how does the code know whether this is a BAC sync spec?
          // const syncSpec: ArSyncSpec = JSON.parse(syncSpecStr);
          const syncSpec: ArSyncSpec = this.convertSyncSpec(syncSpecBac);
          resolve(syncSpec);
        }
      });
    });
  }

  // Gets a file referenced by a syncSpec, not an actual sync spec
  getSyncSpecFile(fileName: string, syncSpec: ArSyncSpec, rootPath: string): Promise<object> {

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
