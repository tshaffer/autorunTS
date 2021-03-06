import * as React from 'react';

import {
  DmState,
  DmcZone,
  dmGetZoneById,
  dmGetZonesForSign,
} from '@brightsign/bsdatamodel';

import MediaZoneContainer from '../containers/mediaZoneContainer';
import TickerZoneContainer from '../containers/tickerZoneContainer';

export interface SignProps {
  bsdm: DmState;
  playbackState: string;
}

// let ImportableComponent: any = null;

export default class Sign extends React.Component<SignProps, object> {

  // constructor(props: any) {
  //   super(props);
  //   const pluginSource = '/Users/tedshaffer/Documents/Projects/importableComponent/dist/importablecomponent.js';
  //   ImportableComponent = eval('require')(pluginSource);
  // }

  getMediaZoneJSX(zone: DmcZone): object {

    return (
      <div
        key={zone.id}
        style={{
          position: 'absolute',
          left: zone.absolutePosition.x,
          top: zone.absolutePosition.y,
          width: zone.absolutePosition.width,
          height: zone.absolutePosition.height,
        }}
      >
        <MediaZoneContainer
          key={zone.id}
          playbackState={this.props.playbackState}
          bsdm={this.props.bsdm}
          zone={zone}
          width={Number(zone.absolutePosition.width)}
          height={Number(zone.absolutePosition.height)}
          activeMediaStateId={''}
        />
      </div>
    );
  }

  getTickerZoneJSX(zone: DmcZone) {

    return (
      <div
        key={zone.id}
        style={{
          position: 'absolute',
          left: zone.absolutePosition.x,
          top: zone.absolutePosition.y,
          width: zone.absolutePosition.width,
          height: zone.absolutePosition.height,
        }}
      >
        <TickerZoneContainer
          key={zone.id}
          playbackState={this.props.playbackState}
          bsdm={this.props.bsdm}
          zone={zone}
          left={Number(zone.absolutePosition.x)}
          top={Number(zone.absolutePosition.y)}
          width={Number(zone.absolutePosition.width)}
          height={Number(zone.absolutePosition.height)}
        />
      </div>
    );
  }

  getZoneJSX(zoneId: string): object {

    const zone: DmcZone = dmGetZoneById(this.props.bsdm, {id: zoneId});

    switch (zone.type) {
      case 'VideoOrImages': {
        return this.getMediaZoneJSX(zone);
      }
      case 'Ticker': {
        return this.getTickerZoneJSX(zone);
      }
      default: {
        debugger;
      }
    }
  }

  render() {

    const zoneIds: string[] = dmGetZonesForSign(this.props.bsdm);

    {/*<ImportableComponent/>*/}
    return (
      <div>
        {
          zoneIds.map((zoneId) =>
            this.getZoneJSX(zoneId),
          )
        }
      </div>
    );
  }
}
