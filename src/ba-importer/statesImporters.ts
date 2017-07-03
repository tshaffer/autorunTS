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
  DmImageContentItemData,
  DmMrssDataFeedContentItem,
  dmCreateMrssDataFeedContentItem,
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
  dmCreateAssetItemFromLocalFile,
} from '@brightsign/bsdatamodel';

import {
  dmAddZone, DmDerivedNonMediaContentItem, dmUpdateMediaState
} from '@brightsign/bsdatamodel';

import * as Converters from './converters';
import * as Utilities from '../utilities/utilities';

interface MediaStateProperties {
  name : string;
  transitionType : TransitionType;
  transitionDuration : number;
};
type MediaStateNameToMediaStateProperties = { [mediaStateName : string]: MediaStateProperties };

export let mapBacMediaStateNameToMediaStateProps : MediaStateNameToMediaStateProperties = {};

function addImageItem(name : string, bacImageItem : any, zoneId : BsDmId, dispatch : Function) : Promise<BsDmAction<MediaStateParams>> {

  const fileName : string = bacImageItem.file['@name'];
  const filePath : string = Utilities.getPoolFilePath(fileName);
  const bsAssetItem  : BsAssetItem= dmCreateAssetItemFromLocalFile(filePath, '', MediaType.Image);

  const mediaStateDuration : number = Converters.stringToNumber(bacImageItem.slideDelayInterval);
  const transitionType : TransitionType = Converters.getTransitionType(bacImageItem.slideTransition);
  const transitionDuration : number = Converters.stringToNumber(bacImageItem.transitionDuration);
  const videoPlayerRequired : boolean = Converters.stringToBool(bacImageItem.videoPlayerRequired);

  mapBacMediaStateNameToMediaStateProps[name] = {
    name : fileName,
    transitionType,
    transitionDuration,
  }

  const imageContentItemData : DmImageContentItemData = {
    useImageBuffer : false,
    videoPlayerRequired
  };

  const contentItem  : BsAssetItem | DmDerivedNonMediaContentItem= bsAssetItem;

  const addMediaStatePromise  : Promise<BsDmAction<MediaStateParams>> = dispatch(dmAddMediaState(name, dmGetZoneMediaStateContainer(zoneId),
    contentItem, imageContentItemData));
  return addMediaStatePromise;

}
export function addMediaStates(zoneId : BsDmId, bacZone : any, dispatch : Function) : any {

  const bacStates = bacZone.playlist.states.state;

  let iterableStates : any = bacStates;
  if (!(bacStates instanceof Array)) {
    iterableStates = [bacStates];
  }

  let addMediaStatePromises : Array<any> = [];
  // let addMediaStatePromises : Array<Promise<BsDmAction<MediaStateParams>>> = [];
  iterableStates.forEach( (bacMediaState : any) => {

    let contentItem : BsAssetItem | DmDerivedNonMediaContentItem;
    let addMediaStatePromise : Promise<BsDmAction<MediaStateParams>>;

    if (bacMediaState.imageItem) {

      const bacImageItem : any = bacMediaState.imageItem;
      addMediaStatePromise = addImageItem(bacMediaState.name, bacImageItem, zoneId, dispatch);
    }
    else if (bacMediaState.slickItem) {
      const bacSlickItem : any = bacMediaState.slickItem;

      // try to fool bsdm
      const url : DmParameterizedString = dmGetParameterizedStringFromString(JSON.stringify(bacSlickItem));
      const dataFeedAction : BsDmAction<DataFeedParams> = dmAddDataFeed(bacSlickItem.name, url, DataFeedUsageType.Mrss);
      const dataFeedParamAction : BsDmAction<DataFeedParams> = dispatch(dataFeedAction);
      const dataFeedParams : DataFeedParams = dataFeedParamAction.payload;
      const dataFeedId : BsDmId = dataFeedParams.id;
      // const dataFeedContentItem : DmDataFeedContentItem = dmCreateDataFeedContentItem(bacSlickItem.name, dataFeedId);
      const dataFeedContentItem : DmMrssDataFeedContentItem = dmCreateMrssDataFeedContentItem(bacSlickItem.name, dataFeedId);
      console.log(dataFeedContentItem);

      contentItem = dataFeedContentItem;

      addMediaStatePromise = dispatch(dmAddMediaState(bacMediaState.name, dmGetZoneMediaStateContainer(zoneId), contentItem));
    }
    else if (bacMediaState.videoItem) {
      debugger;
    }

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

/*
 <<<<<<< 7e6ea66ff4557fee6cfe3d6206282b22ad2d6377
 function addMediaStates(zoneId : BsDmId, bacZone : any, dispatch : Function) {

 const bacStates = bacZone.playlist.states.state;

 bacStates.forEach( (bacMediaState : any) => {

 let fileName;
 let filePath;
 let bsAssetItem : BsAssetItem;
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
 }
 else if (bacMediaState.videoItem) {
 debugger;
 }

 const addMediaStateThunk : BsDmThunkAction<MediaStateParams> = (dmAddMediaState(bacMediaState.name, dmGetZoneMediaStateContainer(zoneId), bsAssetItem));
 const bsDmAction : BsDmAction<MediaStateParams> = dispatch(addMediaStateThunk);
 const mediaStateParams : MediaStateParams = bsDmAction.payload;
 });
 }

 =======
 >>>>>>> initial work on slick. failing to load css files.

 */

