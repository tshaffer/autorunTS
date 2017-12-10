import {
    ActionWithPayload,
    ActiveMediaStatesShape,
    ArState,
} from '../types/index';

// ------------------------------------
// Constants
// ------------------------------------
export const SET_ACTIVE_MEDIA_STATE = 'SET_ACTIVE_MEDIA_STATE';

// ------------------------------------
// Actions
// ------------------------------------
export function setActiveMediaState(zoneId : string, mediaStateId : string) {

    return {
        type: SET_ACTIVE_MEDIA_STATE,
        payload: {
            zoneId,
            mediaStateId,
        },
    };
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState : ActiveMediaStatesShape = {
    activeMediaStateIdByZone : {},
};

export default function(state : ActiveMediaStatesShape = initialState, action : ActionWithPayload) {

    switch (action.type) {

        case SET_ACTIVE_MEDIA_STATE: {

            const newState : ActiveMediaStatesShape = Object.assign({}, state);

            const { zoneId, mediaStateId } = action.payload;
            newState.activeMediaStateIdByZone[zoneId] = mediaStateId;

            // console.log(newState);

            return newState;
        }
    }

    return state;
}

// ------------------------------------
// Selectors
// ------------------------------------
export function getActiveMediaStateId(state : ArState, zoneId : string) {

    const activeMediaStateIdByZone = state.activeMediaStates.activeMediaStateIdByZone;
    return activeMediaStateIdByZone[zoneId];
}
