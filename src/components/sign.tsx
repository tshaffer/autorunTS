import * as React from 'react';

// import ImportableComponent from '../../../importableComponent/dist/importableComponent.js';
import ImportableComponent = require('../../../importableComponent/dist/importableComponent');

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
    playbackState : string;
}

export default class Sign extends React.Component<SignProps, object> {

  plugin : any;
  mainDiv : any;

  constructor (props : any) {
    super(props);

    // const pluginSource = '/Users/tedshaffer/Documents/Projects/autorunTs/plugins/plugin-0';
    const pluginSource = '/Users/tedshaffer/Documents/Projects/importableComponent/dist/importablecomponent.js';
    this.plugin = eval('require')(pluginSource);
    // console.log(this.plugin.foo, this.plugin.bar);
  }

    getMediaZoneJSX(zone : DmcZone) : object {

      return (
            <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.absolutePosition.x,
                  top: zone.absolutePosition.y + 50,
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

    getTickerZoneJSX(zone : DmcZone) {

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

    getZoneJSX(zoneId : string) : object {

        const zone : DmcZone = dmGetZoneById(this.props.bsdm, { id: zoneId });

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

    renderPluginContents(mainDiv : any) {
      const pluginHtml = this.plugin.text;
      mainDiv.appendChild(pluginHtml);
    }

    render() {

      const self = this;

      const zoneIds : string[] = dmGetZonesForSign(this.props.bsdm);

      return (
            <div>
              <ImportableComponent/>
              {
                    zoneIds.map( (zoneId) =>
                        this.getZoneJSX(zoneId),
                    )
              }
            </div>
        );
    }
}
