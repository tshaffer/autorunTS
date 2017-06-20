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

export default class ImageState extends HState {

    bsdm : DmState;
    bsdmImageState : DmcMediaState;
    nextState : HState;
    dispatch : Function;
    stateMachine : ZoneHSM;

    constructor(zoneHSM : ZoneHSM, bsdmImageState : DmcMediaState ) {

        super(zoneHSM, bsdmImageState.id);
        this.bsdm = zoneHSM.bsdm;
        this.bsdmImageState = bsdmImageState;

        this.superState = zoneHSM.stTop;

        this.HStateEventHandler = this.STDisplayingImageEventHandler;
    }

    setNextState( nextState : HState ) {
        this.nextState = nextState;
    }

    STDisplayingImageEventHandler(event : ArEventType, stateData : HSMStateData) : string {

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
