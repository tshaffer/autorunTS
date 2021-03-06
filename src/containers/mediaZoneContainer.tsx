import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

import {
    DmZone,
    DmState,
} from '@brightsign/bsdatamodel';

import {
    ArEventType,
    ArState,
} from '../types';

import MediaZone from '../components/mediaZone';

import { bsp } from '../app/bsp';

import { getActiveMediaStateId } from '../store/activeMediaStates';

export interface MediaZoneStateProps {
    key : string;
    playbackState : string;
    bsdm : DmState;
    zone : DmZone;
    width : number;
    height : number;
    activeMediaStateId : string;
}

export interface MediaZoneDispatchProps {
    postBSPMessage : Function;
}

export function postBSPMessage(event : ArEventType) {
    return bsp.postMessage(event);
}

function mapStateToProps(state : ArState, ownProps : MediaZoneStateProps) : MediaZoneStateProps {
  return {
      ...ownProps,
    activeMediaStateId: getActiveMediaStateId(state, ownProps.zone.id),
  };
}

const mapDispatchToProps = (dispatch : Dispatch<ArState>) : MediaZoneDispatchProps => {
    return bindActionCreators({
        postBSPMessage,
    }, dispatch);
};

const MediaZoneContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(MediaZone);

export default MediaZoneContainer;
