import * as React from 'react';

import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import {
    ArState,
} from '../types';

import { setPlaybackState } from '../store/stateMachine';
// import { postMessage } from '../store/stateMachine';

import Sign from '../components/sign';

// HACK
export let myApp = {};

class App extends React.Component<any, object> {

    state: object;

    constructor(props: object) {
        super(props);

        myApp = this;
    }

    render() {

        if (this.props.bsdm.zones.allZones.length === 0 ||
            Object.keys(this.props.activeMediaStates.activeMediaStateIdByZone).length === 0) {
            return (
                <div>
                  Waiting for the presentation to be loaded...
                </div>
            );
        }

        // postMessage={this.props.postMessage}
        return (
            <Sign
                bsdm={this.props.bsdm}
                playbackState={this.props.playbackState}
            />
        );
    }
}

function mapStateToProps(state : ArState) {

    return {
        bsdm: state.bsdm,
        playbackState: state.stateMachine.playbackState,
        activeMediaStates : state.activeMediaStates,
    };
}

const mapDispatchToProps = (dispatch: Dispatch<ArState>) => {
    return bindActionCreators({
        setPlaybackState,
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
