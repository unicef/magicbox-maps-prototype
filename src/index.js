import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Home from './authorization/Home/Home';
import Callback from './authorization/Callback/Callback';
import Auth from './authorization/Auth/Auth';
import history from './authorization/history';
import Shield from './authorization/Shield';
import App from './App';

import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();


