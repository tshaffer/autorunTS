import fs = require('fs');
import path = require('path');

const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

import {
  DataFeedUsageType,
  AssetLocation,
  bscGetLocalAssetLocator,
  bscGetFileMediaType,
  AssetType,
  BsAssetItem,
  GraphicsZOrderType,
  DeviceWebPageDisplay,
  LanguageKeyType,
  LanguageType,
  MonitorOrientationType,
  MonitorOverscanType,
  TouchCursorDisplayModeType,
  UdpAddressType,
  VideoConnectorType,
  BsColor,
  GpioType,
  BsRect,
  ViewModeType,
  MosaicMaxContentResolutionType,
  ImageModeType,
  EventType,
  MediaType,
  TransitionType,
  BsAssetId,
} from '@brightsign/bscore';

import {
  dmAddZone, DmDerivedNonMediaContentItem, dmUpdateMediaState
} from '@brightsign/bsdatamodel';

import {
  DmDataFeedContentItem,
  DataFeedParams,
  dmGetParameterizedStringFromString,
  DmDataFeed,
  DmParameterizedString,
  dmCreateDataFeedContentItem,
  dmGetSimpleStringFromParameterizedString,
  DataFeedAction,
  dmAddDataFeed,
  dmCreateHtmlContentItem,
  DmcMediaState,
  dmGetMediaStateByName,
  TransitionAction,
  dmAddTransition,
  dmAddEvent,
  BsDmId,
  EventAction,
  MediaStateParams,
  dmGetZoneMediaStateContainer,
  BsDmAction,
  ZoneParams,
  dmAddMediaState,
  DmSignState,
  dmGetSignState,
  dmNewSign, DmSignMetadata, DmSignProperties,
  dmUpdateSignProperties,
  SignAction,
  DmSerialPortConfiguration,
  DmSerialPortList,
  SerialPortListParams,
  dmUpdateSignSerialPorts,
  GpioListParams,
  DmGpioList,
  dmUpdateSignGpio,
  DmButtonPanelMap,
  ButtonPanelMapParams,
  dmUpdateSignButtonPanelMap,
  DmBpConfiguration,
  DmAudioSignProperties,
  DmAudioSignPropertyMap,
  dmUpdateSignAudioPropertyMap,
  AudioSignPropertyMapParams,
  dmUpdateZoneProperties,
  ZonePropertyUpdateParams,
  VideoOrImagesZonePropertyParams,
} from '@brightsign/bsdatamodel';

import * as Converters from './converters';
import * as Utilities from '../utilities/utilities';

import {
  setPoolAssetFiles,
} from '../utilities/utilities';

import ScheduledPresentation from './scheduledPresentation';
import PresentationToSchedule from "./presentationToSchedule";

export function dmCreateAssetItemFromLocalFile(
  fullPath: string,
  id: BsAssetId = '',
  mediaType: MediaType = null,
): BsAssetItem {
  const name = fullPath.replace(/^.*[\\\/]/, '');
  const path = fullPath.substr(0, fullPath.length - name.length);
  return {
    id,
    name,
    path,
    networkId: 0,
    location: AssetLocation.Local,
    locator: bscGetLocalAssetLocator(fullPath),
    assetType: AssetType.Content,
    mediaType: mediaType ? mediaType : bscGetFileMediaType(name),
  };
}

type ArFileLUT = { [fileName:string]: string };

interface ArSyncSpecHash {
  method : string;
  hex : string;
}

interface ArSyncSpecDownload {
  name : string;
  hash : ArSyncSpecHash;
  size : number;
  link : string;
}

export interface ArSyncSpec {
  meta : any;
  files : any;
}

export interface ConvertedPackage {
  syncSpec : any;
  autoSchedule : AutoSchedule;
}

export interface AutoSchedule {
  scheduledPresentations : Array<ScheduledPresentation>
};

type MediaStateIdToMediaStateName = { [mediaStateId:string]: string };

interface MediaStateProperties {
  name : string;
  mediaStateDuration : number;
  transitionType : TransitionType;
  transitionDuration : number;
  videoPlayerRequired : boolean;
};

type MediaStateNameToMediaStateProperties = { [mediaStateName : string]: MediaStateProperties };

let mapBacMediaStateNameToMediaStateProps : MediaStateNameToMediaStateProperties = {};
let mediaStateNamesToUpdateByMediaStateId : MediaStateIdToMediaStateName = {};

// type MyProp1 = string;
// type MyProp2 = number;
//
// interface MyObj {
//   prop1 : MyProp1,
//   prop2 : MyProp2
// };

export function importPublishedFiles(rootPath : string, dispatch : Function, getState : Function) : Promise<ConvertedPackage> {

  // let myObj : MyObj = {} as MyObj;

  let convertedPackage : ConvertedPackage = {
    syncSpec : null,
    autoSchedule: null
  };

  return new Promise( (resolve, reject) => {
    // TODO - first pass, assume local-sync.json
    getSyncSpec(rootPath).then( (syncSpec) => {

      convertedPackage.syncSpec = syncSpec;

      const poolAssetFiles: ArFileLUT = buildPoolAssetFiles(syncSpec, rootPath);
      setPoolAssetFiles(poolAssetFiles);
      getAutoschedule(syncSpec, rootPath).then((autoSchedule: AutoSchedule) => {

        convertedPackage.autoSchedule = autoSchedule;

        // TODO - only a single scheduled item is currently supported
        const scheduledPresentation = autoSchedule.scheduledPresentations[0];
        const presentationToSchedule = scheduledPresentation.presentationToSchedule;
        const presentationName = presentationToSchedule.name;

        const autoplayFileName = 'autoplay-' + presentationName + '.json';
        getSyncSpecReferencedFile(autoplayFileName, syncSpec, rootPath).then((autoPlay: object) => {
          convertAutoplay(autoPlay, dispatch, getState).then(() => {
            console.log(getState());
            resolve(convertedPackage);
          });
        });
      });
    });
  });
}

function getAutoschedule(syncSpec: ArSyncSpec, rootPath: string) : Promise<AutoSchedule> {

  return new Promise( (resolve) => {
    getSyncSpecReferencedFile('autoschedule.json', syncSpec, rootPath).then( (autoScheduleBac : any) => {
      const autoSchedule : AutoSchedule= convertAutoSchedule(autoScheduleBac);
      resolve(autoSchedule);
    });
  });
}

function getSyncSpecReferencedFile(fileName: string, syncSpec: ArSyncSpec, rootPath: string): Promise<object> {

  return new Promise<object>((resolve: Function, reject: Function) => {

    const syncSpecFile: ArSyncSpecDownload = getFile(syncSpec, fileName);
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

function getFile(syncSpec: ArSyncSpec, fileName: string): ArSyncSpecDownload {

  let file: ArSyncSpecDownload = null;

  syncSpec.files.download.forEach((syncSpecFile: ArSyncSpecDownload) => {
    if (syncSpecFile.name === fileName) {
      file = syncSpecFile;
      return;
    }
  });

  return file;
}

function buildPoolAssetFiles(syncSpec: ArSyncSpec, pathToPool: string): ArFileLUT {

  const poolAssetFiles: ArFileLUT = {};

  syncSpec.files.download.forEach((syncSpecFile: ArSyncSpecDownload) => {
    poolAssetFiles[syncSpecFile.name] = path.join(pathToPool, syncSpecFile.link);
  });

  return poolAssetFiles;
}


// TODO - write syncSpec (and all converted files)? or just leave them in memory? or make this configurable?
function getSyncSpec(syncSpecDirectory : string) : Promise<ArSyncSpec> {
  return new Promise( (resolve, reject) => {
    const bacSyncSpecFilePath = path.join(syncSpecDirectory, "local-sync.json");
    readJsonFile(bacSyncSpecFilePath).then( (bacSyncSpec) => {
      const syncSpec: ArSyncSpec = convertSyncSpec(bacSyncSpec);
      resolve(syncSpec);
    })
  });
}

export function convertSyncSpec(bacSyncSpec : any) : ArSyncSpec {

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
    client[clientKey] = bacSyncSpec.sync.meta.client[clientKey];
  }
  // TODO - some of these types are WRONG
  syncSpec.meta.client = client;

  syncSpec.files = {};

  syncSpec.files.delete = bacSyncSpec.sync.files.delete;

  syncSpec.files.ignore = bacSyncSpec.sync.files.ignore;

  syncSpec.files.download = [];

  bacSyncSpec.sync.files.download.forEach( (downloadBac : any) => {
    let download : any = {};
    download.link = downloadBac.link;
    download.name = downloadBac.name;
    download.size = Number(downloadBac.size);
    download.hash = {};
    download.hash.hex = downloadBac.hash['#text'];
    download.hash.method = downloadBac.hash['@method'];

    syncSpec.files.download.push(download);
  });

  return syncSpec;
}

// read a json file - convert to json object
function readJsonFile(filePath : string) : Promise<any> {

  return new Promise<any>((resolve: Function, reject: Function) => {

    fs.readFile(filePath, (err: Error, dataBuffer: Buffer) => {

      if (err) {
        reject(err);
      } else {
        const fileContents: string = decoder.write(dataBuffer);
        const fileContentsJson : any = JSON.parse(fileContents);
        resolve(fileContentsJson);
      }
    });
  });

}

export function convertAutoSchedule(autoScheduleBac : any) : AutoSchedule {

  // only works now for a single scheduledPresentation
  let scheduledPresentationBac : any = autoScheduleBac.autoschedule.scheduledPresentation;

  const presentationToSchedule = new PresentationToSchedule(
    scheduledPresentationBac.presentationToSchedule.name,
    scheduledPresentationBac.presentationToSchedule.fileName,
    scheduledPresentationBac.presentationToSchedule.filePath,
    {}
  );

  const scheduledPresentation = new ScheduledPresentation(
    presentationToSchedule,
    scheduledPresentationBac.dateTime,
    Number(scheduledPresentationBac.duration),
    (scheduledPresentationBac.allDayEveryDay.toLowerCase() === 'true'),
    (scheduledPresentationBac.recurrence.toLowerCase() === 'true'),
    scheduledPresentationBac.recurrencePattern,
    scheduledPresentationBac.recurrencePatternDaily,
    Number(scheduledPresentationBac.recurrencePatternDaysOfWeek),
    scheduledPresentationBac.recurrenceStartDate,
    (scheduledPresentationBac.recurrenceGoesForever.toLowerCase() === 'true'),
    scheduledPresentationBac.recurrenceEndDate,
     false);
  let autoSchedule : AutoSchedule = {
    scheduledPresentations : [scheduledPresentation]
  };
  return autoSchedule;
}

function updateAutoplaySignProperties(bacMeta : any, dispatch: Function, getState : Function) {

  let signAction : SignAction;
  let signState : DmSignState;
  let signMetadata : DmSignMetadata;
  let signProperties : DmSignProperties;

  let state = getState();

  signState = dmGetSignState(state.bsdm);
  signMetadata = signState.sign;
  signProperties = signMetadata.properties;

  const alphabetizeVariableNames : boolean = Converters.stringToBool(bacMeta.alphabetizeVariableNames);
  const autoCreateMediaCounterVariables : boolean = Converters.stringToBool(bacMeta.autoCreateMediaCounterVariables);
  const backgroundScreenColor : BsColor = {
    a: Converters.stringToNumber(bacMeta.backgroundScreenColor['@a']),
    r: Converters.stringToNumber(bacMeta.backgroundScreenColor['@a']),
    g: Converters.stringToNumber(bacMeta.backgroundScreenColor['@a']),
    b: Converters.stringToNumber(bacMeta.backgroundScreenColor['@a']),
  };
  const delayScheduleChangeUntilMediaEndEvent : boolean = Converters.stringToBool(bacMeta.delayScheduleChangeUntilMediaEndEvent.toLowerCase());
  const deviceWebPageDisplay : DeviceWebPageDisplay = bacMeta.deviceWebPageDisplay;
  const flipCoordinates : boolean =  Converters.stringToBool(bacMeta.flipCoordinates);
  const forceResolution : boolean = Converters.stringToBool(bacMeta.forceResolution);
  const graphicsZOrder : GraphicsZOrderType = bacMeta.graphicsZOrder;
  const htmlEnableJavascriptConsole : boolean = Converters.stringToBool(bacMeta.htmlEnableJavascriptConsole);
  const inactivityTime : number = Converters.stringToNumber(bacMeta.inactivityTime);
  const inactivityTimeout : boolean = Converters.stringToBool(bacMeta.inactivityTimeout);
  const isMosaic : boolean = Converters.stringToBool(bacMeta.isMosaic);
  const language : LanguageType = bacMeta.language;
  const languageKey : LanguageKeyType = bacMeta.languageKey;
  const monitorOrientation : MonitorOrientationType = bacMeta.monitorOrientation;
  const monitorOverscan : MonitorOverscanType = bacMeta.monitorOverscan;
  const resetVariablesOnPresentationStart : boolean = Converters.stringToBool(bacMeta.resetVariablesOnPresentationStart);
  const tenBitColorEnabled : boolean = Converters.stringToBool(bacMeta.tenBitColorEnabled);
  const touchCursorDisplayMode : TouchCursorDisplayModeType = bacMeta.touchCursorDisplayMode;
  const udpDestinationAddress : string = bacMeta.udpDestinationAddress;
  const udpDestinationAddressType : UdpAddressType = bacMeta.udpDestinationAddressType;
  const udpDestinationPort : number = Converters.stringToNumber(bacMeta.udpDestinationPort);
  const udpReceiverPort : number = Converters.stringToNumber(bacMeta.udpReceiverPort);
  const videoConnector : VideoConnectorType = bacMeta.videoConnector;

  signAction = dispatch(dmUpdateSignProperties(
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
}

function updateAutoplaySerialPorts(bacMeta : any, dispatch: Function) {

  let serialPortConfiguration : DmSerialPortConfiguration;
  let serialPortList : DmSerialPortList = [];

  bacMeta.SerialPortConfiguration.forEach( (serialPortConfigurationBac : any) => {
    serialPortConfiguration = {
      port : Converters.stringToNumber(serialPortConfigurationBac.port),
      baudRate : Converters.stringToNumber(serialPortConfigurationBac.baudRate),
      dataBits: Converters.stringToNumber(serialPortConfigurationBac.dataBits),
      stopBits: Converters.stringToNumber(serialPortConfigurationBac.stopBits),
      parity: serialPortConfigurationBac.parity,
      protocol: serialPortConfigurationBac.protocol,
      sendEol : serialPortConfigurationBac.sendEol,
      receiveEol : serialPortConfigurationBac.receiveEol,
      invertSignals : Converters.stringToBool(serialPortConfigurationBac.invertSignals),
      connectedDevice : serialPortConfigurationBac.connectedDevice,
    };
    serialPortList.push(serialPortConfiguration);
  });

  let serialPortListParams : SerialPortListParams = {
    params : serialPortList
  };

  dispatch(dmUpdateSignSerialPorts(serialPortListParams));
}

function updateAutoplayGpio(bacMeta : any, dispatch: Function) {

  let gpioList : DmGpioList = [];

  for (let i = 0; i < 8; i++) {
    const gpio : GpioType = bacMeta['gpio' + i.toString()];
    gpioList.push(gpio);
  }
  let gpioListParams : GpioListParams = {
    params : gpioList
  };

  dispatch(dmUpdateSignGpio(gpioListParams));
}

function updateAutoplayButtonPanels(bacMeta : any, dispatch: Function) {

  let bpConfiguration : DmBpConfiguration;
  let buttonPanelMap : DmButtonPanelMap = {};

  let buttonPanelNames : Array<string> = [
    'BP200A',
    'BP200B',
    'BP200C',
    'BP200D',
    'BP900A',
    'BP900B',
    'BP900C',
    'BP900D',
  ];
  for (let buttonPanelName of buttonPanelNames) {
    let configureAutomatically : boolean = Converters.stringToBool(bacMeta[buttonPanelName +  'ConfigureAutomatically']);
    let configuration : number = Converters.stringToNumber(bacMeta[buttonPanelName + 'Configuration']);
    bpConfiguration = {
      configureAutomatically,
      configuration
    };
    buttonPanelMap[buttonPanelName.toLowerCase()] = bpConfiguration;
  }

  const buttonPanelMapParams : ButtonPanelMapParams = {
    params : buttonPanelMap
  };

  dispatch(dmUpdateSignButtonPanelMap(buttonPanelMapParams));
}

function updateAutoplayAudio(bacMeta : any, dispatch: Function) {

  let audioSignPropertyMap : DmAudioSignPropertyMap = {};
  let audioSignProperties : DmAudioSignProperties;

  let bacAudioNames : Array<string> = [
    'audio1',
    'audio2',
    'audio3',
    'spdif',
    'usbA',
    'usbB',
    'usbC',
    'usbD',
    'hdmi',
  ];

  for (let bacAudioName of bacAudioNames) {
    audioSignProperties = {
      min : Converters.stringToNumber(bacMeta[bacAudioName + 'MinVolume']),
      max : Converters.stringToNumber(bacMeta[bacAudioName + 'MaxVolume'])
    };

    let audioName : string = bacAudioName;
    switch (bacAudioName) {
      case 'audio1': {
        audioName = 'analog1';
        break;
      }
      case 'audio2': {
        audioName = 'analog2';
        break;
      }
      case 'audio3': {
        audioName = 'analog3';
        break;
      }
    }
    audioSignPropertyMap[audioName] = audioSignProperties;
  }

  const audioSignPropertyMapParams : AudioSignPropertyMapParams = {
    params : audioSignPropertyMap
  };

  dispatch(dmUpdateSignAudioPropertyMap(audioSignPropertyMapParams));
}

function createZone(bacZone : any, dispatch : Function) : any {

  let bsRect : BsRect = {
    x: Converters.stringToNumber(bacZone.x),
    y: Converters.stringToNumber(bacZone.y),
    width: Converters.stringToNumber(bacZone.width),
    height: Converters.stringToNumber(bacZone.height),
    pct: false
  };

  const actionParams : BsDmAction<ZoneParams> = dispatch(dmAddZone(bacZone.name, bacZone.type, bacZone.id, bsRect,
    bacZone.playlist.type === 'non-interactive'));
  console.log(actionParams);
  const zoneId = actionParams.payload.id;
  const zoneType = actionParams.payload.type;
  // need to call dmUpdateZone - to set initialMediaStateId

  return {
    zoneId,
    zoneType
  };
}

function setZoneProperties(zoneId : BsDmId, zoneType : string, bacZone : any, dispatch : Function) {

  let viewMode : ViewModeType;
  switch (bacZone.viewMode) {
    case 'Fill Screen and Centered': {
      viewMode = ViewModeType.FillAndCenter;
      break;
    }
    case 'Scale to Fill': {
      viewMode = ViewModeType.ScaleToFill;
      break;
    }
    default: {
      viewMode = ViewModeType.Letterboxed;
      break;
    }
  }

  let zoneSpecificParameters : any = bacZone.zoneSpecificParameters;

  // TODO - maxContentResolution
  // TODO - mosaic decoder name
  // TODO - audioOutputAssignments : DmAudioOutputAssignmentMap;
  // TODO - audioVolume?
  // TODO - enumerate all values output by BAC

  let videoOrImagesZonePropertyParams : VideoOrImagesZonePropertyParams = {
    viewMode : viewMode,
    liveVideoInput : zoneSpecificParameters.liveVideoInput,
    liveVideoStandard : zoneSpecificParameters.liveVideoStandard,
    videoVolume : Converters.stringToNumber(zoneSpecificParameters.videoVolume),
    brightness : Converters.stringToNumber(zoneSpecificParameters.brightness),
    contrast : Converters.stringToNumber(zoneSpecificParameters.contrast),
    saturation : Converters.stringToNumber(zoneSpecificParameters.saturation),
    hue : Converters.stringToNumber(zoneSpecificParameters.hue),
    zOrderFront : Converters.stringToBool(zoneSpecificParameters.zOrderFront),
    mosaic : Converters.stringToBool(zoneSpecificParameters.mosaic),
    maxContentResolution : MosaicMaxContentResolutionType.NotApplicable,
    audioMixMode : Converters.getAudioMixMode(zoneSpecificParameters.audioMixMode),
    minimumVolume : Converters.stringToNumber(zoneSpecificParameters.minimumVolume),
    maximumVolume : Converters.stringToNumber(zoneSpecificParameters.maximumVolume),
    imageMode: ImageModeType.ScaleToFill,
  };

  let zonePropertyUpdateParams : ZonePropertyUpdateParams = {
    id : zoneId,
    type: zoneType,
    properties : videoOrImagesZonePropertyParams
  };

  dispatch(dmUpdateZoneProperties(zonePropertyUpdateParams));
}

function addMediaStates(zoneId : BsDmId, bacZone : any, dispatch : Function) : any {

  const bacStates = bacZone.playlist.states.state;

  let iterableStates : any = bacStates;
  if (!(bacStates instanceof Array)) {
    iterableStates = [bacStates];
  }

  let addMediaStatePromises : Array<any> = [];
  // let addMediaStatePromises : Array<Promise<BsDmAction<MediaStateParams>>> = [];
  iterableStates.forEach( (bacMediaState : any) => {

    let fileName;
    let filePath;
    let bsAssetItem : BsAssetItem;
    let contentItem : BsAssetItem | DmDerivedNonMediaContentItem;
    if (bacMediaState.imageItem) {

      const bacImageItem : any = bacMediaState.imageItem;

      fileName = bacImageItem.file['@name'];
      filePath = Utilities.getPoolFilePath(fileName);
      bsAssetItem = dmCreateAssetItemFromLocalFile(filePath, '', MediaType.Image);

      const mediaStateDuration : number = Converters.stringToNumber(bacImageItem.slideDelayInterval);
      const transitionType : TransitionType = Converters.getTransitionType(bacImageItem.slideTransition);
      const transitionDuration : number = Converters.stringToNumber(bacImageItem.transitionDuration);
      const videoPlayerRequired : boolean = Converters.stringToBool(bacImageItem.videoPlayerRequired);

      mapBacMediaStateNameToMediaStateProps[bacMediaState.name] = {
        name : fileName,
        mediaStateDuration,
        transitionType,
        transitionDuration,
        videoPlayerRequired
      }

      contentItem = bsAssetItem;
    }
    else if (bacMediaState.slickItem) {
      const bacSlickItem : any = bacMediaState.slickItem;

      // try to fool bsdm
      const url : DmParameterizedString = dmGetParameterizedStringFromString(JSON.stringify(bacSlickItem));
      const dataFeedAction : BsDmAction<DataFeedParams> = dmAddDataFeed(bacSlickItem.name, url, DataFeedUsageType.Text);
      const dataFeedParamAction : BsDmAction<DataFeedParams> = dispatch(dataFeedAction);
      const dataFeedParams : DataFeedParams = dataFeedParamAction.payload;
      const dataFeedId : BsDmId = dataFeedParams.id;
      const dataFeedContentItem : DmDataFeedContentItem = dmCreateDataFeedContentItem(bacSlickItem.name, dataFeedId);
      console.log(dataFeedContentItem);

      contentItem = dataFeedContentItem;
    }
    else if (bacMediaState.videoItem) {
      debugger;
    }

    const addMediaStatePromise : Promise<BsDmAction<MediaStateParams>> = dispatch(dmAddMediaState(bacMediaState.name, dmGetZoneMediaStateContainer(zoneId), contentItem));
    addMediaStatePromises.push(addMediaStatePromise);
  });

  return addMediaStatePromises;
}

// export function dmCreateDataFeedContentItem(name: string, dataFeedId: BsDmId): DmDataFeedContentItem;

const createHtmlContentItem = (asset : any = {}) => {
  //const currentHtmlSites = dmGetHtmlSiteIdsForSign(getBsdmStore(state));
  //if(currentHtmlSites.length > 0)
  //  return dmGetMediaStateById(state.bsdm, {id: currentHtmlSites[0]});
  //else
  //  return null;
  return dmCreateHtmlContentItem(
    asset.name,
    asset.siteId,
    asset.enableExternalData,
    asset.enableMouseEvents,
    asset.displayCursor,
    asset.hwzOn,
    asset.useUserStylesheet,
    asset.userStylesheetAssetId,
    asset.customFonts
  );
};

function addTransitions(bacZone : any, dispatch : Function, getState : Function) {

  const state = getState().bsdm;

  const transitions = bacZone.playlist.states.transition;

  if (transitions) {
    transitions.forEach( (bacTransition : any) => {
      console.log(bacTransition);

      // TODO I don't see the following 3 variables used in bsdm - ??
      const assignInputToUserVariable : boolean = Converters.stringToBool(bacTransition.assignInputToUserVariable);
      const assignWildcardToUserVariable : boolean = Converters.stringToBool(bacTransition.assignWildcardToUserVariable);
      const remainOnCurrentStateActions : string = bacTransition.remainOnCurrentStateActions;
      const sourceMediaStateName : string = bacTransition.sourceMediaState;
      const targetMediaStateName : string = bacTransition.targetMediaState;
      const userEvent : any = bacTransition.userEvent;
      const userEventName : string = userEvent.name;
      const parameters : any = userEvent.parameters;
      const parameter : string = parameters.parameter;
      // TODO - need code to properly convert parameters
      const duration : number = Number(parameter);

      // TODO - what is duration vs. mediaStateDuration? answer - they are set to the same value.

      const sourceMediaState : DmcMediaState = dmGetMediaStateByName(state, { name : sourceMediaStateName});

      const targetMediaState : DmcMediaState = dmGetMediaStateByName(state, { name : targetMediaStateName});

      const mediaStateProps : MediaStateProperties = mapBacMediaStateNameToMediaStateProps[sourceMediaState.name];
      const { name, mediaStateDuration, transitionType, transitionDuration, videoPlayerRequired } = mediaStateProps;
      mediaStateNamesToUpdateByMediaStateId[sourceMediaState.id] = name;

      // TODO - what is the proper js method to convert from string to enum value, in this case EventType.Timer?
      const eventAction : EventAction = dispatch(dmAddEvent(userEventName, EventType.Timer, sourceMediaState.id,
        { interval : duration} ));
      console.log(eventAction);

      const transitionAction : TransitionAction = dispatch(dmAddTransition('myTransition', eventAction.payload.id,
        targetMediaState.id, transitionType, transitionDuration));
      console.log(transitionAction);
    });
  }
}


function updateAutoplayZone(bacZone : any, dispatch : Function, getState : Function) {

  return new Promise( (resolve) => {

    let { zoneId, zoneType } = createZone(bacZone, dispatch);

    setZoneProperties(zoneId, zoneType, bacZone, dispatch);

    const initialMediaStateId = bacZone.playlist.states.initialState;

    const addMediaStatePromises : any = addMediaStates(zoneId, bacZone, dispatch);
    Promise.all(addMediaStatePromises).then((mediaStateParamActions : Array<BsDmAction<MediaStateParams>>) => {
      addTransitions(bacZone, dispatch, getState);
      updateNames(mediaStateNamesToUpdateByMediaStateId, dispatch);
      resolve();
    });
  });
}

function updateNames(namesToUpdateById : MediaStateIdToMediaStateName, dispatch : Function){

  // rename media states to something rational
  for (let mediaStateId in namesToUpdateById) {
    if (namesToUpdateById.hasOwnProperty(mediaStateId)) {
      const name = namesToUpdateById[mediaStateId];
      dispatch(dmUpdateMediaState( {
        id : mediaStateId,
        name
      }));
    }
  }
}

function updateAutoplayZones(bacZones : any, dispatch: Function, getState : Function) {

  let promises : Array<any> = [];

  return new Promise( (resolve) => {
    bacZones.forEach( (bacZone : any) => {
      promises.push(updateAutoplayZone(bacZone, dispatch, getState));
    });
    Promise.all(promises).then( () => {
      resolve();
    });
  });
}

export function convertAutoplay(autoplayBac : any, dispatch: Function, getState : Function) {

  return new Promise( (resolve) => {
    let state : any;
    let signAction : SignAction;

    const bacMeta = autoplayBac.BrightAuthor.meta;
    signAction = dispatch(dmNewSign(bacMeta.name, bacMeta.videoMode, bacMeta.model));

    updateAutoplaySignProperties(bacMeta, dispatch, getState);
    updateAutoplaySerialPorts(bacMeta, dispatch);
    updateAutoplayGpio(bacMeta, dispatch);
    updateAutoplayButtonPanels(bacMeta, dispatch);
    updateAutoplayAudio(bacMeta, dispatch);

    let bacZones : any = [];
    const bacZone = autoplayBac.BrightAuthor.zones;
    if (bacZone instanceof Array) {
      bacZones = autoplayBac.BrightAuthor.zones;
    }
    else {
      bacZones = [autoplayBac.BrightAuthor.zones.zone];
    }

    updateAutoplayZones(bacZones, dispatch, getState).then( () => {
      resolve();
    });
  })
}

