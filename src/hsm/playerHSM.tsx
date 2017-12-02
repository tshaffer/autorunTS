import {HSM, HState, STTopEventHandler} from './HSM';

import {
  DmState,
  dmGetDataFeedIdsForSign,
} from '@brightsign/bsdatamodel';

import PlatformService from '../platform';

import {BSP} from '../app/bsp';
import {
  ArEventType,
  HSMStateData,
  ArDataFeedLUT,
} from '../types/index';

export class PlayerHSM extends HSM {

  type: string;
  bsp: BSP;
  dispatch: Function;
  getState: Function;
  bsdm: DmState;
  stTop: HState;
  stPlayer: HState;
  stPlaying: HState;
  stWaiting: HState;

  constructor(bsp: BSP, dispatch: Function, getState: Function, bsdm: DmState) {

    super();

    this.type = 'player';

    this.bsp = bsp;
    this.dispatch = dispatch;
    this.getState = getState;
    this.bsdm = bsdm;

    this.stTop = new HState(this, 'Top');
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.initialPseudoStateHandler = this.initializePlayerStateMachine;

    this.stPlayer = new STPlayer(this, 'Player', this.stTop);
    this.stPlaying = new STPlaying(this, 'Playing', this.stPlayer);
    this.stWaiting = new STWaiting(this, 'Waiting', this.stPlayer);

    this.topState = this.stTop;
  }

  initializePlayerStateMachine() {

    console.log('initializePlayerStateMachine invoked');

    PlatformService.default.addEventHandlers(this.bsp);

    // ISSUE
    // would like restartBSP to return a promise, then transition to the stPlaying state once that is done.
    // however, this function requires an immediate response
    // the problem is that entering stPlaying state invokes startBSPPlayback before the zones are even created
    this.bsp.restartPlayback('').then(() => {
      // send event to cause transition to stPlaying
      const event = {
        EventType: 'TRANSITION_TO_PLAYING'
      };
      this.dispatch(this.bsp.postMessage(event));
    });

    // from autorunClassic

    // activeScheduledPresentation = m.bsp.schedule.activeScheduledEvent
    // if type(activeScheduledPresentation) = "roAssociativeArray" then
    //   return m.stPlaying
    // else
    //   return m.stWaiting
    // endif

    // because of issue above
    return this.stWaiting;
  }
}


class STPlayer extends HState {

  constructor(stateMachine: PlayerHSM, id: string, superState: HState) {

    super(stateMachine, id);

    this.HStateEventHandler = this.STPlayerEventHandler;
    this.superState = superState;
  }

  STPlayerEventHandler(event: ArEventType, stateData: HSMStateData): string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ': entry signal');

      if (this.stateMachine.bsp.enableRemoteSnapshot) {
        this.stateMachine.bsp.initiateRemoteSnapshotTimer();
      }

      return 'HANDLED';
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}

class STPlaying extends HState {

  constructor(stateMachine: PlayerHSM, id: string, superState: HState) {
    super(stateMachine, id);

    this.HStateEventHandler = this.STPlayingEventHandler;
    this.superState = superState;
  }

  STPlayingEventHandler(event: ArEventType, stateData: HSMStateData): string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {

      console.log(this.id + ': entry signal');

      // TODO
      // set a timer for when the current presentation should end

      // TODO
      // assume presentation is active

      // TODO
      // check for live data feeds that include content (either MRSS or content for Media Lists / PlayFiles).
      // for each of them, check to see if the feed and/or content already exists.

      const stateMachine = this.stateMachine as PlayerHSM;

      // update bsdm
      stateMachine.bsdm = stateMachine.getState().bsdm;

      // load live data feeds and queue for downloading
      stateMachine.bsp.liveDataFeedsToDownload = [];

      const dataFeedIds = dmGetDataFeedIdsForSign(stateMachine.bsdm);

      // debugger;
      // const aState = stateMachine.getState();
      // const aDataFeeds = aState.dataFeeds;
      // const aDataFeedsById = aDataFeeds.dataFeedsById;

      const dataFeedsById: ArDataFeedLUT = stateMachine.getState().dataFeeds.dataFeedsById;
      dataFeedIds.forEach((dataFeedId: string) => {
        const dataFeed = dataFeedsById[dataFeedId];
        stateMachine.bsp.queueRetrieveLiveDataFeed(dataFeed);
      });

      // launch playback
      const state = stateMachine.getState();
      stateMachine.bsdm = state.bsdm;
      stateMachine.bsp.startPlayback();

      return 'HANDLED';
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}

class STWaiting extends HState {

  constructor(stateMachine: PlayerHSM, id: string, superState: HState) {
    super(stateMachine, id);

    this.HStateEventHandler = this.STWaitingEventHandler;
    this.superState = superState;
  }

  STWaitingEventHandler(event: ArEventType, stateData: HSMStateData): string {

    stateData.nextState = null;

    if (event.EventType && event.EventType === 'ENTRY_SIGNAL') {
      console.log(this.id + ': entry signal');
      return 'HANDLED';
    } else if (event.EventType && event.EventType === 'TRANSITION_TO_PLAYING') {
      console.log(this.id + ': TRANSITION_TO_PLAYING event received');
      stateData.nextState = (this.stateMachine as PlayerHSM).stPlaying;
      return 'TRANSITION';
    }

    stateData.nextState = this.superState;
    return 'SUPER';
  }
}

