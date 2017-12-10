import { HState } from './HSM';

import {
  ZoneHSM,
} from './zoneHSM';

import {
  BsDmId,
  DmEvent,
  DmMediaState,
  dmGetEventIdsForMediaState,
  dmGetEventStateById,
  dmGetMediaStateStateById,
  dmGetZoneById,
  dmGetZoneSimplePlaylist,
  dmGetMediaStateById,
  dmGetMediaStateIdsForZone,
} from '@brightsign/bsdatamodel';

import {
  LUT,
} from '../types';

import ImageState from './imageState';
import MediaHState from './mediaHState';
import SuperState from './superState';
import VideoState from './videoState';
import MRSSDataFeedState from './mrssDataFeedState';
import { ContentItemType } from '../../../bsDataModel/node_modules/@brightsign/bscore';

export class MediaZoneHSM extends ZoneHSM {

  allMediaStateIds : BsDmId[] = [];
  mediaStateIdToHState : LUT = {};

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

    // debugger;
    // this.mediaStateIds = [];
    // this.getAllMediaStateIds(this.bsdm, zoneId);

    // states
    this.mediaStates = [];
    debugger;
    this.addMediaStates(this.stTop, zoneId);
    debugger;
    // this.addStates();

    // // events / transitions
    // this.mediaStateIds.forEach( (mediaStateId : BsDmId) => {
    //   const hState : MediaHState = this.mediaStateIdToHState[mediaStateId];
    //   const eventIds : BsDmId[] = dmGetEventIdsForMediaState(this.bsdm, { id : mediaStateId });
    //   hState.addEvents(this, eventIds);
    // });

    // // fix up the transitions vis a vis superStates
    // this.mediaStateIds.forEach( (mediaStateId : BsDmId) => {
    //   const mediaHState : MediaHState = this.mediaStateIdToHState[mediaStateId];
    //   // invoke a method on the mediaHState to fix the targets of its transitions when they the target is a superState.
    //   mediaHState.fixTargetState();
    // });      
  }

  addMediaStates(superHState: HState, containerId : BsDmId) {
    const mediaStateIds : BsDmId[] = dmGetMediaStateIdsForZone(this.bsdm, { id: containerId });
    mediaStateIds.forEach( (mediaStateId) => {
      this.addMediaState(superHState, containerId, mediaStateId);
    });      
  }

  addMediaState(superHState: HState, containerId: BsDmId, mediaStateId: BsDmId) {

    let hState : MediaHState = null;
    
    const bsdmMediaState : DmMediaState = dmGetMediaStateById(this.bsdm, { id : mediaStateId});
    switch (bsdmMediaState.contentItem.type) {
      case ContentItemType.Image: {
        hState = new ImageState(this, superHState, bsdmMediaState);
        break;
      }
      case ContentItemType.Video: {
        hState = new VideoState(this, superHState, bsdmMediaState);
        break;
      }
      case ContentItemType.MrssFeed: {
        hState = new MRSSDataFeedState(this, superHState, bsdmMediaState);
        break;
      }
      case ContentItemType.SuperState: {
        hState = new SuperState(this, superHState, bsdmMediaState);
        this.addMediaStates(hState, bsdmMediaState.id);
        break;
      }
      default: {
        debugger;
      }
    }
    this.mediaStates.push(hState);
    this.mediaStateIdToHState[mediaStateId] = hState;
}





  getAllMediaStateIds(bsdm : any, containerId : BsDmId) {
    const mediaStateIds : BsDmId[] = dmGetMediaStateIdsForZone(bsdm, { id: containerId });
    mediaStateIds.forEach( (mediaStateId) => {
      this.mediaStateIds.push(mediaStateId);
      const mediaState : DmMediaState = dmGetMediaStateStateById(bsdm, { id : mediaStateId });
      if (mediaState.contentItem.type === ContentItemType.SuperState) {
        this.getAllMediaStateIds(bsdm, mediaState.id);
      }
    })
  }

  // addStates() {

  //   let newState : MediaHState = null;

  //   this.mediaStateIds.forEach( (mediaStateId : BsDmId, index : number) => {
  //     const bsdmMediaState : DmMediaState = dmGetMediaStateById(this.bsdm, { id : mediaStateId});
  //     if (bsdmMediaState.contentItem.type === 'Image') {
  //       newState = new ImageState(this, bsdmMediaState);
  //     } else if (bsdmMediaState.contentItem.type === 'Video') {
  //       newState = new VideoState(this, bsdmMediaState);
  //     } else if (bsdmMediaState.contentItem.type === 'MrssFeed') {
  //       newState = new MRSSDataFeedState(this, bsdmMediaState);
  //     } else if (bsdmMediaState.contentItem.type === 'SuperState') {
  //       newState = new SuperState(this, bsdmMediaState);        
  //     }     
  //     this.mediaStates.push(newState);
  //     this.mediaStateIdToHState[mediaStateId] = newState;
  //   });
  // }

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
