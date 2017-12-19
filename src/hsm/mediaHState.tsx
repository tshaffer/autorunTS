import {
  EventType
} from '@brightsign/bscore';

import {
    BsDmId,
    DmBpEventData,
    DmEvent,
    DmcEvent,
    DmcMediaState,
    DmcTransition,
    dmGetMediaStateStateById,
    dmGetMediaStateByName,
    DmMediaListContentItem,
    DmMediaState,
    DmTransition,
    DmState,
    DmSuperStateContentItem,
    DmTimer,
    dmGetEventIdsForMediaState,
    dmGetEventStateById,
    dmGetTransitionById,
    dmGetTransitionIdsForEvent,
    dmGetZoneById,
    dmGetZoneSimplePlaylist,
    dmGetMediaStateById,
    dmGetMediaStateIdsForZone,
    MediaStateContainerType,
  } from '@brightsign/bsdatamodel';
    
  import {
    ArEventType,
    HSMStateData,
    SubscribedEvents,
  } from '../types';
import { bsp } from '../app/bsp';  
import { HState } from './HSM';
import { ZoneHSM } from './zoneHSM';
import { MediaZoneHSM } from './mediaZoneHSM';

import VideoState from './videoState';
import { ContentItemType } from '../../../bsDataModel/node_modules/@brightsign/bscore';

export default class MediaHState extends HState {

  mediaState: DmMediaState;
  bsdm : DmState;
  
  // rename eventLUT - indicate that it maps from events to target hState.
  mapEventToHState : SubscribedEvents = {};
  timeoutInterval : number = null;
  timeout : any = null;

  // if the target state is a superState or mediaList, change it to the initial state of the targetState
  updateTransitionsToContainer() {
    for (const event in this.mapEventToHState) {
      if (this.mapEventToHState.hasOwnProperty(event)) {
        const targetHState = this.mapEventToHState[event];
        const targetMediaState = (targetHState as MediaHState).mediaState;
        if (targetMediaState.contentItem.type === ContentItemType.SuperState) {
          const superStateContentItem : DmSuperStateContentItem = targetMediaState.contentItem as DmSuperStateContentItem;
          const initialMediaState : DmMediaState = dmGetMediaStateByName(this.bsdm, 
            { name : superStateContentItem.initialMediaStateName});
          const initialMediaHState : HState = (this.stateMachine as MediaZoneHSM).mediaStateIdToHState[initialMediaState.id];
          this.mapEventToHState[event] = initialMediaHState;
        }
        else if (targetMediaState.contentItem.type === ContentItemType.MediaList) {
          const mediaListContentItem : DmMediaListContentItem = targetMediaState.contentItem as DmMediaListContentItem;
          const initialMediaStateId :BsDmId = mediaListContentItem.mediaStates[0];
          const initialMediaState : DmMediaState = dmGetMediaStateById(this.bsdm, { id : initialMediaStateId});
          const initialMediaHState : HState = (this.stateMachine as MediaZoneHSM).mediaStateIdToHState[initialMediaState.id];
          this.mapEventToHState[event] = initialMediaHState;
        }
      }
    }
  }

  addEvents(zoneHSM : ZoneHSM, eventIds : BsDmId[]) {

    eventIds.forEach( (eventId : BsDmId) => {
      
      // generate eventKey
      const event : DmEvent = dmGetEventStateById(zoneHSM.bsdm, { id : eventId });
      const eventKey : string = this.getHStateEventKey(event);

      // not sure best way to do this, so do it this way for now
      if (event.type === EventType.Timer) {
        const interval : number = (event.data as DmTimer).interval;
        this.timeoutInterval = interval;
      }
      // get transition
      const transitionIds : BsDmId[] = dmGetTransitionIdsForEvent(zoneHSM.bsdm, {id : event.id} );
      // TODO - only support a single transition per event for now
      if (transitionIds.length !== 1) {
        debugger;
      }
      const transition : DmcTransition = dmGetTransitionById(zoneHSM.bsdm, { id : transitionIds[0]} );

      // TODO - limited functionality at the moment
      const targetMediaStateId = transition.targetMediaStateId;

      // TODO - may be bogus
      const mediaZoneHSM : MediaZoneHSM = zoneHSM as MediaZoneHSM;

      // TODO - use a function - don't use LUT directly
      const targetMediaHState : HState = mediaZoneHSM.mediaStateIdToHState[targetMediaStateId];
      this.mapEventToHState[eventKey] = targetMediaHState;
    });
  }

  mediaHStateEventHandler(event : ArEventType, stateData : HSMStateData) : string {

    const bsEventKey : string = this.getBsEventKey(event);
    // TODO - hack to workaround unfinished code
    if (bsEventKey !== '') {
      if (this.mapEventToHState.hasOwnProperty(bsEventKey)) {
        stateData.nextState = this.mapEventToHState[bsEventKey];
        return 'TRANSITION';
      }
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }


  mediaHStateExitHandler() : void {
    console.log(this.id + ': exit signal');
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }


  getBsEventKey(bsEvent : ArEventType) :string {
    
    let bsEventKey : string = '';

    switch (bsEvent.EventType) {
      case EventType.Bp: {
        bsEventKey = bsEvent.EventData.ButtonPanelName + '-' + bsEvent.EventData.ButtonIndex.toString();
        break;
      }
      case EventType.Timer: {
        bsEventKey = 'timer-' + this.id;
        break;
      }
      case EventType.MediaEnd: {
        bsEventKey = 'mediaEnd-' + this.id;
        break;
      }
      default: {
        break;
      }
    };

    return bsEventKey;  
  }


  getHStateEventKey(event : DmEvent) : string {

    let eventKey : string = '';

    console.log('getHState, event type is: ' + event.type);

    switch (event.type) {
      case EventType.Bp: {
        // TODO - refine
        const eventData : DmBpEventData = event.data as DmBpEventData;

        switch (eventData.buttonPanelType) {
          case 'BP900': {
            switch (eventData.buttonPanelIndex) {
              case 0: {
                eventKey = 'bp900a' + '-' + eventData.buttonNumber.toString();
                break;                
              }
              case 1: {
                eventKey = 'bp900b' + '-' + eventData.buttonNumber.toString();
                break;                
              }
              default: {
                // TODO - implement me
                debugger;
              }
            }
            break;
          }
          case 'BP200': {
              // TODO - implement me
            debugger;
          }
        }
        break;
      }
      case EventType.Timer: {
        const eventData : DmTimer = event.data as DmTimer;
        eventKey = 'timer-' + this.id;
        break;
      }
      case EventType.MediaEnd: {
        eventKey = 'mediaEnd-' + this.id;
        break;
      }
    }

    return eventKey;
  }
  
  launchTimer() : void {
    if (this.timeoutInterval && this.timeoutInterval > 0) {
      this.timeout = setTimeout(this.timeoutHandler, this.timeoutInterval * 1000, this);
    }
  }

  timeoutHandler(mediaHState : MediaHState) {
    this.timeout = null;
    const eventKey : string = 'timer-' + mediaHState.id;
    if (mediaHState.mapEventToHState.hasOwnProperty(eventKey)) {
      const targetHState : HState = mediaHState.mapEventToHState[eventKey];

      const event : ArEventType = {
        EventType: EventType.Timer,
      };

      bsp.dispatchPostMessage(event);
    }
  }
}
    