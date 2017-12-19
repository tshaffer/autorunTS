import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import { bsp } from '../app/bsp';

import reducers from '../store/reducers';

export function appInit() : any {
  const store = createStore(
    reducers,
    applyMiddleware(
      thunkMiddleware,
    ),
  );

  bsp.initialize(store);

  return store;
}
