import * as React from 'react';

import path = require('path');

import {
  ArEventType,
} from '../types';

// import DesktopPlatformService from '../platform/desktop/DesktopPlatformService';

import ImageContainer from '../containers/imageContainer';
import SlickContainer from '../containers/slickContainer';
import VideoContainer from '../containers/videoContainer';
import MrssDisplayItemContainer from '../containers/mrssDisplayItemContainer';
// import ComponentPluginContainer from '../containers/componentPluginContainer';

import { getPoolFilePath } from '../utilities/utilities';

import {
  dmGetAssetItemById,
} from '@brightsign/bsdatamodel';
import {BsAssetItem} from "@brightsign/bscore";

import {
  ContentItemType,
  EventType,
} from '@brightsign/bscore';

import {
  // DmHtmlComponentContentItem,
  // DmSlickCarouselContentItem,
  BsDmId,
  DmDataFeedContentItem,
  DmDerivedContentItem,
  DmMediaContentItem,
  DmEvent,
  DmMediaState,
  DmState,
  dmGetMediaStateById,
  dmGetEventIdsForMediaState,
  dmGetEventById,
} from '@brightsign/bsdatamodel';

import { MediaZoneStateProps, MediaZoneDispatchProps } from '../containers/mediaZoneContainer';

export default class MediaZone extends React.Component<MediaZoneStateProps & MediaZoneDispatchProps, object> {

  postTimeoutEvent()  {
    const event : ArEventType = {
      EventType : 'timeoutEvent',
    };
    this.props.postBSPMessage(event);
  }

  postMediaEndEvent()  {
    const event : ArEventType = {
      EventType : 'mediaEndEvent',
    };
    this.props.postBSPMessage(event);
  }

  renderMediaItem(mediaState : DmMediaState, contentItem: DmDerivedContentItem, event : DmEvent) {

    let duration : number = 10;

    const self = this;

    // unsafe cast
    const mediaContentItem : DmMediaContentItem = contentItem as DmMediaContentItem;

    const assetId : string = mediaContentItem.assetId;
    const assetItem : BsAssetItem = dmGetAssetItemById(this.props.bsdm, { id : assetId });

    // TODO - near term (likely) fix
    // const fileId : string = assetItem.name;
    const fileId : string = mediaState.name;

    const poolFilePath : string = getPoolFilePath(fileId);
    const src : string = path.join('file://', poolFilePath);

    const mediaType : ContentItemType = mediaContentItem.type;

    const eventName : EventType = event.type;
    switch (eventName) {
      case 'Timer': {
        duration = event.data.interval;
        break;
      }
      case 'MediaEnd': {
        break;
      }
      default: {
        debugger;
      }
    }

    switch (mediaType) {
      case 'Image': {
        return (
          <ImageContainer
            width={this.props.width}
            height={this.props.height}
            duration={duration * 1000}
            onTimeout={self.postTimeoutEvent.bind(this)}
            src={src}
          />
        );
      }
      case 'Video': {
        return (
          <VideoContainer
            width={this.props.width}
            height={this.props.height}
            onVideoEnd={self.postMediaEndEvent.bind(this)}
            src={src}
          />
        );
      }
      default: {
        debugger;
      }
    }
  }

  renderMrssItem(mrssContentItem : DmDataFeedContentItem) {

    const duration : number = 3;

    const self = this;

    const dataFeedId : string = mrssContentItem.dataFeedId;

    return (
      <MrssDisplayItemContainer
        dataFeedId={dataFeedId}
        width={this.props.width}
        height={this.props.height}
        duration={duration * 1000}
        onTimeout={self.postTimeoutEvent.bind(this)}
      />
    );
  }

  // renderSlickItem(slickItem : DmSlickCarouselContentItem) {
  //
  //   // let foo : DmSlickCarouselContentItem | {} = {};
  //
  //   return (
  //     <SlickContainer
  //       width={this.props.width}
  //       height={this.props.height}
  //       contentItems={slickItem.contentItems}
  //       filePaths={[]}
  //     />
  //   );
  // }

  // renderComponentPluginItem(mediaState : DmMediaState, componentPluginItem : DmHtmlComponentContentItem, event : DmEvent) {
  //
  //   let duration : number = event.data.interval;
  //
  //   const self = this;
  //
  //   let componentPath = path.join(componentPluginItem.reactComponent.path, componentPluginItem.reactComponent.name);
  //   return (
  //     <ComponentPluginContainer
  //       name={componentPluginItem.name}
  //       componentPath={componentPath}
  //       properties={componentPluginItem.properties}
  //       duration={duration * 1000}
  //       onTimeout={self.postTimeoutEvent.bind(this)}
  //     />
  //   );
  // }

  getEvent( bsdm : DmState, mediaStateId: string ) : DmEvent {

    const eventIds : BsDmId[] = dmGetEventIdsForMediaState(bsdm, { id : mediaStateId });
    // if (eventIds.length !== 1) {
    if (eventIds.length === 0) {
      console.log('no event');
      return null;
    }

    const event : DmEvent = dmGetEventById(bsdm, { id : eventIds[0] });
    if (!event) {
      console.log('no event');
    }

    return event;
  }

  render() {

    console.log('mediaZone.js::render invoked');

    if (this.props.playbackState !== 'active') {
      return (
        <div>Playback state inactive</div>
      );
    }

    const mediaStateId : string = this.props.activeMediaStateId;
    const mediaState : DmMediaState = dmGetMediaStateById(this.props.bsdm, { id : mediaStateId });

    const event : DmEvent = this.getEvent(this.props.bsdm, mediaState.id);
    const contentItem : DmDerivedContentItem = mediaState.contentItem;

    switch (contentItem.type) {
      case'Video':
      case 'Image': {
        return this.renderMediaItem(mediaState, contentItem as DmMediaContentItem, event);
      }
      case 'MrssFeed': {
        return this.renderMrssItem(contentItem as DmDataFeedContentItem);
      }
      // case 'SlickCarousel': {
      //   return this.renderSlickItem(contentItem as DmSlickCarouselContentItem);
      // }
      // case 'HtmlComponent': {
      //   return this.renderComponentPluginItem(mediaState, contentItem as DmHtmlComponentContentItem, event);
      // }
      default: {
        break;
      }
    }
  }
}
