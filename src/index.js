import React from 'react';
import config from './config'
import ReactDOM from 'react-dom';
import {Route, Router} from 'react-router-dom';
import './index.css';
import Home from './authorization/Home/Home';
import Callback from './authorization/Callback/Callback';
import Auth from './authorization/Auth/Auth';
import history from './authorization/history';
import Shield from './authorization/Shield';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import registerServiceWorker from './registerServiceWorker';
const auth = new Auth();

/**
 * Returns score between 0 and 1
 * @param  {Object} location
 */
const handleAuthentication = ({location}) => {
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication();
  }
}

if (config.login_required) {
  ReactDOM.render(
    <Router history={history}>
      <div>
        <Route path='/' render={(props) =>
          <Shield auth={auth} {...props} />} />
        <Route path='/home' render={(props) =>
          <Home auth={auth} {...props} />} />
        <Route path='/authorization/callback' render={(props) => {
          handleAuthentication(props);
          return <Callback {...props} />
        }}/>
      </div>
   </Router>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}


registerServiceWorker();


