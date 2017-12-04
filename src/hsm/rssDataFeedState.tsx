import {
  DmMediaState,
  DmState,
} from '@brightsign/bsdatamodel';

import { HState } from './HSM';
import MediaHState from './mediaHState';

import {HSMStateData, ArEventType} from '../types/index';
import {TickerZoneHSM} from './tickerZoneHSM';

export default class RSSDataFeedState extends MediaHState {

  bsdmState: DmMediaState;
  nextState : HState;

  constructor(zoneHSM: TickerZoneHSM, bsdmState: DmMediaState) {

    super(zoneHSM, bsdmState.id);
    this.bsdm = zoneHSM.bsdm;
    this.bsdmState = bsdmState;

    this.superState = zoneHSM.stTop;

    this.HStateEventHandler = this.STDisplayingRSSDataFeedEventHandler;

  }

  STDisplayingRSSDataFeedEventHandler(event : ArEventType, stateData : HSMStateData) : string {
    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log('entry signal');
      return 'HANDLED';
    } else if (event.EventType && event.EventType === 'EXIT_SIGNAL') {
      console.log('exit signal');
    }
    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
