import { HState } from './HSM';

import {
  EventType,
  ButtonPanelName,
} from '@brightsign/bscore';

import {
  BsDmId,
  DmMediaState,
  DmState,
  dmGetMediaStateIdsForZone,
} from '@brightsign/bsdatamodel';

import {
  ArEventType,
  HSMStateData,
} from '../types';
import MediaHState from './mediaHState';
import { ZoneHSM } from './zoneHSM';
import { MediaZoneHSM } from './mediaZoneHSM';
import { setActiveMediaState } from '../store/activeMediaStates';

export default class SuperState extends MediaHState {

  stateMachine : ZoneHSM;

  constructor(zoneHSM : ZoneHSM, superHState: HState, mediaState : DmMediaState ) {

      super(zoneHSM, mediaState.id);
      this.bsdm = zoneHSM.bsdm;
      this.mediaState = mediaState;

      const state : DmState = this.bsdm;
      const id : BsDmId = this.id;
      const mediaStateIds : BsDmId[] = dmGetMediaStateIdsForZone(state, { id });

      this.superState = superHState;
  
      this.HStateEventHandler = this.STSuperStateEventHandler;
  }

  STSuperStateEventHandler(event : ArEventType, stateData : HSMStateData) : string {
    
    if (event.EventType === 'ENTRY_SIGNAL') {
        console.log(this.id + ': entry signal');
        // this.stateMachine.dispatch(setActiveMediaState(this.stateMachine.id, this.id));
        this.launchTimer();
        return 'HANDLED';
    } else if (event.EventType === 'EXIT_SIGNAL') {
      this.mediaHStateExitHandler();
    } else {
      console.log('superState received event: ', event);
      return this.mediaHStateEventHandler(event, stateData);
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
