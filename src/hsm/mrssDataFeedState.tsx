import {
  DmDataFeedContentItem,
  DmMediaState,
  DmState,
} from '@brightsign/bsdatamodel';

import { HState } from './HSM';

import MediaHState from './mediaHState';

import { ZoneHSM } from './zoneHSM';
import  MrssDataFeed  from '../entities/mrssDataFeed';
import  MRSSFeed  from '../entities/mrssFeed';

import {
  setActiveMediaState,
} from '../store/activeMediaStates';

import {
  setMrssDataFeedItem,
} from '../store/mrssDataFeedItems';
import {HSMStateData, ArEventType} from '../types/index';

export default class MRSSDataFeedState extends MediaHState {

  bsdmState: DmMediaState;
  dataFeed : MrssDataFeed;
  currentFeed : MRSSFeed;
  pendingFeed : MRSSFeed;
  displayIndex : number;
  stateMachine : ZoneHSM;

  constructor(zoneHSM: ZoneHSM, superHState: HState, bsdmState: DmMediaState) {

    super(zoneHSM, bsdmState.id);
    this.bsdm = zoneHSM.bsdm;
    this.bsdmState = bsdmState;

    this.superState = superHState;

    this.HStateEventHandler = this.STDisplayingMRSSDataFeedEventHandler;

    const contentItem : DmDataFeedContentItem = bsdmState.contentItem as DmDataFeedContentItem;
    this.dataFeed = this.stateMachine.getState().dataFeeds.dataFeedsById[contentItem.dataFeedId];
  }

  // STPlayingMediaRSSEventHandler in ba classic

  STDisplayingMRSSDataFeedEventHandler(event : ArEventType, stateData : HSMStateData) : string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log('entry signal');
      this.currentFeed = new MRSSFeed(null);
      this.pendingFeed = new MRSSFeed(null);

      // get data feed associated with this state
      if (this.dataFeed.feedPoolAssetFiles &&
        Object.keys(this.dataFeed.feedPoolAssetFiles).length === this.dataFeed.assetsToDownload.length) {

        // feed is fully downloaded
        this.currentFeed = this.dataFeed.feed;
        this.displayIndex = 0;
        this.advanceToNextMRSSItem(true);
      } else {
        debugger;
      }

      return 'HANDLED';
    } else if (event.EventType && event.EventType === 'EXIT_SIGNAL') {
      console.log('exit signal');
    } else if (event.EventType && event.EventType === 'timeoutEvent') {
      console.log('timeout event');

      // check to see if it's at the end of the feed
      // if (this.atEndOfFeed()) {
      //   stateData.nextState = this.nextState;
      //   return 'TRANSITION';
      // }

      this.advanceToNextMRSSItem(false);
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }

  atEndOfFeed() {
    return (this.displayIndex >= this.currentFeed.items.length);
  }

  advanceToNextMRSSItem(onEntry : boolean) {

    if (this.displayIndex >= this.currentFeed.items.length) {
      this.displayIndex = 0;
    }

    const displayItem = this.currentFeed.items[this.displayIndex];
    this.stateMachine.dispatch(setMrssDataFeedItem(this.dataFeed.id, displayItem));

    // should only do this on entry, but it currently only works if setFeedDisplayItem is called first
    if (onEntry) {
      this.stateMachine.dispatch(setActiveMediaState(this.stateMachine.id, this.id));
    }

    this.displayIndex = this.displayIndex + 1;
  }
}
