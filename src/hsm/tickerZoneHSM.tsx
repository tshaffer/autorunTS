import { HState } from './HSM';

import {
  ZoneHSM
} from './zoneHSM';

import RSSDataFeedState from './rssDataFeedState';

import {
  RotationType,
  TextHAlignmentType,
  TextScrollingMethodType,
  DmColor,
  DmRect,
} from '@brightsign/bscore';

import {
  BsDmId,
  DmMediaStateState,
  DmDataFeedContentItem,
  DmTickerZoneProperties,
  dmGetZoneById,
  dmGetZoneSimplePlaylist,
  dmGetMediaStateById,
  dmGetZonePropertiesById,
} from '@brightsign/bsdatamodel';

import {
  ArDataFeedLUT,
  HSMStateData, ArEventType
} from '../types';

import {
  updateDataFeed
} from '../store/dataFeeds';

import {
  MediaHState
} from '../types';

import { DataFeed } from '../entities/dataFeed';

export class TickerZoneHSM extends ZoneHSM {

  numberOfLines : number;
  delay : number;
  rotation : RotationType;
  alignment : TextHAlignmentType;
  scrollingMethod : TextScrollingMethodType;
  scrollSpeed : number;
  backgroundTextColor : DmColor;
  backgroundBitmapAssetId : string;
  font : string;
  fontSize : number;
  foregroundTextColor : DmColor;
  safeTextRegion : DmRect;
  stretchBitmapFile : boolean;
  rssDataFeedItems : DataFeed[];
  includesRSSFeeds : boolean;
  stRSSDataFeedInitialLoad : HState;
  stRSSDataFeedPlaying : HState;

  mediaStates : MediaHState[];

  constructor(dispatch: Function, getState: Function, zoneId: string) {

    super(dispatch, getState, zoneId);

    this.type = 'ticker';

    this.constructorHandler = this.tickerZoneConstructor;
    this.initialPseudoStateHandler = this.tickerZoneGetInitialState;

    const zoneProperties : DmTickerZoneProperties = dmGetZonePropertiesById(this.bsdm, {id: zoneId}) as DmTickerZoneProperties;

    this.numberOfLines = zoneProperties.textWidget.numberOfLines;
    this.delay = zoneProperties.textWidget.delay;

    const rotation = zoneProperties.textWidget.rotation;
    switch (rotation) {
      case"0": {
        this.rotation = 0;
        break;
      }
      case "90": {
        this.rotation = 3;
        break;
      }
      case "180": {
        this.rotation = 2;
        break;
      }
      case "270": {
        this.rotation = 1;
        break;
      }
    }

    const alignment = zoneProperties.textWidget.alignment;
    switch (alignment) {
      case "center": {
        this.alignment = 1;
        break;
      }
      case "right": {
        this.alignment = 2;
        break;
      }
      default: {
        this.alignment = 0;
        break;
      }
    }

    this.scrollingMethod = zoneProperties.textWidget.scrollingMethod;

    this.scrollSpeed = zoneProperties.scrollSpeed;

    // necessary if code must support old format live data feeds
    // zoneHSM.rssDownloadPeriodicValue% = sign.rssDownloadPeriodicValue%
    // zoneHSM.rssDownloadTimer = CreateObject("roTimer")

    this.backgroundTextColor = zoneProperties.widget.backgroundTextColor;
    this.backgroundBitmapAssetId = zoneProperties.widget.backgroundBitmapAssetId;
    this.font = zoneProperties.widget.font;
    this.fontSize = zoneProperties.widget.fontSize;
    this.foregroundTextColor = zoneProperties.widget.foregroundTextColor;
    this.safeTextRegion = zoneProperties.widget.safeTextRegion;
    this.stretchBitmapFile = zoneProperties.widget.stretchBitmapFile;

    this.stRSSDataFeedInitialLoad = new STRSSDataFeedInitialLoad(this, "RSSDataFeedInitialLoad", this.stTop);
    this.stRSSDataFeedPlaying = new STRSSDataFeedPlaying(this, "RSSDataFeedPlaying", this.stTop);

    // in autorun classic, this is done in newPlaylist as called from newZoneHSM
    let self = this;
    this.mediaStateIds = dmGetZoneSimplePlaylist(this.bsdm, { id: zoneId });
    this.mediaStates = [];
    this.rssDataFeedItems = [];

    this.mediaStateIds.forEach( (mediaStateId) => {
      const bsdmMediaState : DmMediaStateState = dmGetMediaStateById(this.bsdm, { id : mediaStateId});
      if (bsdmMediaState.contentItem.type === 'DataFeed') {

        const dataFeedContentItem : DmDataFeedContentItem = bsdmMediaState.contentItem as DmDataFeedContentItem;

        // BACONTODO - I think this is sufficient to set 'includesRSSFeeds'
        self.includesRSSFeeds = true;

        const dataFeedsById : ArDataFeedLUT = getState().dataFeeds.dataFeedsById;
        const dataFeedId = dataFeedContentItem.dataFeedId;
        const dataFeed = dataFeedsById[dataFeedId];
        self.rssDataFeedItems.push(dataFeed);
      }
    });

    let newState : MediaHState = null;

    this.mediaStateIds.forEach( (mediaStateId : BsDmId, index : number) => {
      const bsdmMediaState : DmMediaStateState = dmGetMediaStateById(this.bsdm, { id : mediaStateId});
      if (bsdmMediaState.contentItem.type === 'DataFeed') {
        newState = new RSSDataFeedState(this, bsdmMediaState);
      }
      else {
        debugger;
      }

      this.mediaStates.push(newState);

      if (index > 0) {
        this.mediaStates[index - 1].setNextState(newState);
      }
    });
    this.mediaStates[this.mediaStates.length - 1].setNextState(this.mediaStates[0]);
  }

  tickerZoneConstructor() {

    // where to create the BSTicker??

    // InitializeZoneCommon(m.bsp.msgPort)
    this.bsdmZone = dmGetZoneById(this.bsdm, { id: this.zoneId });

    this.id = this.bsdmZone.id;
    this.name = this.bsdmZone.name;

    // ticker rectangle parameters
    this.x = this.bsdmZone.absolutePosition.x;
    this.y = this.bsdmZone.absolutePosition.y;
    this.width = this.bsdmZone.absolutePosition.width;
    this.height = this.bsdmZone.absolutePosition.height;
  }

  tickerZoneGetInitialState() {
    if (this.includesRSSFeeds) {
      return this.stRSSDataFeedInitialLoad;
    }
    else {
      return this.stRSSDataFeedPlaying;
    }
  }

  processLiveDataFeedUpdate(dataFeed : DataFeed) {
    this.dispatch(updateDataFeed(dataFeed));
  }
}

export class STRSSDataFeedPlaying extends HState {

  constructor(stateMachine : TickerZoneHSM, id : string, superState : HState) {
    super(stateMachine, id);
    this.HStateEventHandler = this.STRSSDataFeedPlayingEventHandler;
    this.superState = superState;
  }

  STRSSDataFeedPlayingEventHandler(event: ArEventType, stateData: HSMStateData): string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ": entry signal");
      // this.populateRSSDataFeedWidget();
      return "HANDLED";
    }

    stateData.nextState = this.superState;
    return "SUPER";
  }
}

class STRSSDataFeedInitialLoad extends HState {

  constructor(stateMachine : TickerZoneHSM, id : string, superState : HState) {
    super(stateMachine, id);
    this.HStateEventHandler = this.STRSSDataFeedInitialLoadEventHandler;
    this.superState = superState;
  }

  STRSSDataFeedInitialLoadEventHandler(event:  ArEventType, stateData: HSMStateData) : string {
    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ": entry signal");
      return "HANDLED";
    }
    else if (event.EventType && event.EventType === 'LIVE_DATA_FEED_UPDATE') {
      (this.stateMachine as TickerZoneHSM).processLiveDataFeedUpdate(event.EventData);
      stateData.nextState = (this.stateMachine as TickerZoneHSM).stRSSDataFeedPlaying;
      return "TRANSITION";
    }

    stateData.nextState = this.superState;
    return "SUPER";
  }
}
