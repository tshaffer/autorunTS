import {
  DmMediaState,
  DmState,
} from '@brightsign/bsdatamodel';

import { HState } from './HSM';

import { ZoneHSM } from './zoneHSM';

import {
  setActiveMediaState,
} from '../store/activeMediaStates';

import {
  ArEventType,
  HSMStateData,
} from '../types';

export default class SlickState extends HState {

  bsdm : DmState;
  bsdmSlickState : DmMediaState;
  nextState : HState;
  dispatch : Function;
  stateMachine : ZoneHSM;

  constructor(zoneHSM : ZoneHSM, bsdmSlickState : DmMediaState ) {

    super(zoneHSM, bsdmSlickState.id);
    this.bsdm = zoneHSM.bsdm;
    this.bsdmSlickState = bsdmSlickState;

    this.superState = zoneHSM.stTop;

    this.HStateEventHandler = this.STDisplayingSlickEventHandler;
  }

  setNextState( nextState : HState ) {
    this.nextState = nextState;
  }

  STDisplayingSlickEventHandler(event : ArEventType, stateData : HSMStateData) : string {

    stateData.nextState = null;

    if (event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ': entry signal');
      this.stateMachine.dispatch(setActiveMediaState(this.stateMachine.id, this.id));
      return 'HANDLED';
    } else if (event.EventType === 'EXIT_SIGNAL') {
      console.log(this.id + ': exit signal');
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
