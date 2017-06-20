import {
  ZoneHSM,
} from './zoneHSM';

import {
  BsDmId,
  DmcMediaState,
  dmGetZoneById,
  dmGetZoneSimplePlaylist,
  dmGetMediaStateById,
} from '@brightsign/bsdatamodel';

import {
  MediaHState,
} from '../types';

import ImageState from './imageState';
import VideoState from './videoState';
import MRSSDataFeedState from './mrssDataFeedState';
import HtmlTableState from './htmlTableState';

export class MediaZoneHSM extends ZoneHSM {

  constructor(dispatch: Function, getState: Function, zoneId: string) {

    super(dispatch, getState, zoneId);

    this.type = 'media';

    this.constructorHandler = this.videoOrImagesZoneConstructor;
    this.initialPseudoStateHandler = this.videoOrImagesZoneGetInitialState;

    // build playlist
    this.bsdmZone = dmGetZoneById(this.bsdm, { id: zoneId });

    this.id = this.bsdmZone.id;
    this.name = this.bsdmZone.name;

    this.x = this.bsdmZone.position.x;
    this.y = this.bsdmZone.position.y;
    this.width = this.bsdmZone.position.width;
    this.height = this.bsdmZone.position.height;

    this.initialMediaStateId = this.bsdmZone.initialMediaStateId;
    this.mediaStateIds = dmGetZoneSimplePlaylist(this.bsdm, { id: zoneId });
    this.mediaStates = [];

    let newState : MediaHState = null;
    this.mediaStateIds.forEach( (mediaStateId : BsDmId, index : number) => {
      const bsdmMediaState: DmcMediaState = dmGetMediaStateById(this.bsdm, {id: mediaStateId});
      if (bsdmMediaState.contentItem.type === 'Image') {
        newState = new ImageState(this, bsdmMediaState);
      } else if (bsdmMediaState.contentItem.type === 'Video') {
        newState = new VideoState(this, bsdmMediaState);
      } else if (bsdmMediaState.contentItem.type === 'MrssFeed') {
        newState = new MRSSDataFeedState(this, bsdmMediaState);
      } else if (bsdmMediaState.contentItem.type === 'VideoStream') {
        newState = new HtmlTableState(this, bsdmMediaState);
      }

      this.mediaStates.push(newState);

      if (index > 0) {
        this.mediaStates[index - 1].setNextState(newState);
      }
    });
    this.mediaStates[this.mediaStates.length - 1].setNextState(this.mediaStates[0]);
  }

  videoOrImagesZoneConstructor() {
    console.log('VideoOrImagesZoneConstructor invoked');

    // const mediaStateIds = dmGetZoneSimplePlaylist(this.bsdm, { id: this.zoneId });
    // should really look at initialMediaStateId, but the following should work for non interactive playlists
    this.activeState = this.mediaStates[0];
  }

  videoOrImagesZoneGetInitialState() {
    console.log('videoOrImagesZoneGetInitialState invoked');

    return this.activeState;
  }
}
