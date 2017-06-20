import {
  DmcMediaState,
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

export default class HtmlTableState extends HState {

  bsdm : DmState;
  bsdmHtmlTableState : DmcMediaState;
  nextState : HState;
  dispatch : Function;
  stateMachine : ZoneHSM;

  constructor(zoneHSM : ZoneHSM, bsdmHtmlTableState : DmcMediaState ) {

    super(zoneHSM, bsdmHtmlTableState.id);
    this.bsdm = zoneHSM.bsdm;
    this.bsdmHtmlTableState = bsdmHtmlTableState;

    this.superState = zoneHSM.stTop;

    this.HStateEventHandler = this.STDisplayingHtmlTableEventHandler;
  }

  setNextState( nextState : HState ) {
    this.nextState = nextState;
  }

  STDisplayingHtmlTableEventHandler(event : ArEventType, stateData : HSMStateData) : string {

    stateData.nextState = null;

    if (event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ': entry signal');
      this.stateMachine.dispatch(setActiveMediaState(this.stateMachine.id, this.id));
      return 'HANDLED';
    } else if (event.EventType === 'EXIT_SIGNAL') {
      console.log(this.id + ': exit signal');
    } else if (event.EventType === 'timeoutEvent') {
      console.log(this.id + ': timeoutEvent');
      stateData.nextState = this.nextState;
      return 'TRANSITION';
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
