import {Action} from 'redux';

export interface ActionWithPayload extends Action {
    payload : any
};

export interface DataFeedState  {
    dataFeedsById : Object
};

