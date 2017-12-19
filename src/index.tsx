
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { appInit } from './app/app';

import App from './components/app';

const store = appInit();

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('content') as HTMLElement,
);
