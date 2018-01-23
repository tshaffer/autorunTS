import { HState } from './HSM';

import {
  ContentItemType,
  EventType,
  ButtonPanelName,
} from '@brightsign/bscore';

import {
  BsDmId,
  // DmMediaListContentItem,
  DmMediaState,
  DmState,
  EventAction,
  EventParams,
  TransitionAction,
  dmAddEvent,
  dmAddTransition,
  dmGetMediaStateById,
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

export default class MediaList extends MediaHState {

  mediaListContentItem : DmMediaListContentItem;
  stateMachine : ZoneHSM;

  constructor(zoneHSM : ZoneHSM, superHState: HState, mediaState : DmMediaState ) {

      super(zoneHSM, mediaState.id);
      this.bsdm = zoneHSM.bsdm;
      this.mediaState = mediaState;
      this.mediaListContentItem = mediaState.contentItem as DmMediaListContentItem;

      const state : DmState = this.bsdm;
      const id : BsDmId = this.id;

      this.superState = superHState;
  
      this.HStateEventHandler = this.STMediaListEventHandler;
  }

  setEvents() {

    return (dispatch : Function, getState: Function) => {

      console.log(getState());

      const mediaStateIds : BsDmId[] = dmGetMediaStateIdsForZone(this.bsdm, { id : this.id });
      
      // set events, transitions on each mediaState within the list
      for (let i = 0; i < mediaStateIds.length; i++) {

        const mediaStateId = mediaStateIds[i];
        const mediaState : DmMediaState = dmGetMediaStateById(this.bsdm, { id : mediaStateId });

        let targetMediaStateIndex = i + 1;
        if (targetMediaStateIndex >= mediaStateIds.length) {
          targetMediaStateIndex = 0;
        }
        const targetMediaStateId : BsDmId = mediaStateIds[targetMediaStateIndex];
        
        let eventId : BsDmId;
        let eventAction : EventAction;

        switch (mediaState.contentItem.type) {
          case ContentItemType.Image: {
            eventAction = dispatch(dmAddEvent("mediaListTimeout", EventType.Timer, mediaState.id, 
              { interval : this.mediaListContentItem.imageTimeout }));
      console.log(getState());
            break;
          }
          case ContentItemType.Video: {
            eventAction = dispatch(dmAddEvent('mediaListMediaEnd', EventType.MediaEnd, mediaState.id));
            console.log(getState());
            break;
          }
        }

        const eventParams: EventParams = eventAction.payload;
        eventId = eventParams.id;
        dispatch(dmAddTransition('', eventId, targetMediaStateId));
      };
      console.log(getState());
    };
  }

  STMediaListEventHandler(event : ArEventType, stateData : HSMStateData) : string {
    
    if (event.EventType === 'ENTRY_SIGNAL') {
        console.log(this.id + ': entry signal');

        // a lot of stuff needs to go here - see bac autorun
        // this.launchTimer();
        return 'HANDLED';
    } else if (event.EventType === 'EXIT_SIGNAL') {
      this.mediaHStateExitHandler();
    } else {
      console.log('mediaList received event: ', event);
      return this.mediaHStateEventHandler(event, stateData);
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}
