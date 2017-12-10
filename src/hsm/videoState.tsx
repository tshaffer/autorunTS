import {
  EventType,
} from '@brightsign/bscore';

import {
  DmcEvent,
  DmcMediaState,
  DmMediaState,
  DmState,
} from '@brightsign/bsdatamodel';

import { HState } from './HSM';

import MediaHState from './mediaHState';

import { ZoneHSM } from './zoneHSM';

import {
  setActiveMediaState,
} from '../store/activeMediaStates';

import {
  ArEventType,
  HSMStateData,
} from '../types';

export default class VideoState extends MediaHState {

  dispatch : Function;
  stateMachine : ZoneHSM;

  constructor(zoneHSM : ZoneHSM, superHState: HState, mediaState : DmMediaState) {

    super(zoneHSM, mediaState.id);
    this.bsdm = zoneHSM.bsdm;
    this.mediaState = mediaState;

    this.superState = superHState;

    this.HStateEventHandler = this.STDisplayingVideoEventHandler;
  }

  STDisplayingVideoEventHandler(event : ArEventType, stateData : HSMStateData) : string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log('entry signal');
      this.stateMachine.dispatch(setActiveMediaState(this.stateMachine.id, this.id));
      this.launchTimer();
      return 'HANDLED';
    } else if (event.EventType && event.EventType === 'EXIT_SIGNAL') {
      this.mediaHStateExitHandler();
    } else if (event.EventType === EventType.MediaEnd) {
      console.log('videoState received MediaEnd event');
      const eventList : DmcEvent[] = (this.mediaState as DmcMediaState).eventList;
      const bsEventKey : string = this.getBsEventKey(event);
      if (this.eventLUT.hasOwnProperty(bsEventKey)) {
        stateData.nextState = this.eventLUT[bsEventKey];
        return 'TRANSITION';
      }
    } else {
      console.log('videoState received event: ', event);
      return this.mediaHStateEventHandler(event, stateData);
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
