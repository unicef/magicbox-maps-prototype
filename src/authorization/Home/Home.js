// eslint-disable-next-line no-unused-vars
import React, {Component} from 'react';
import App from '../../App';
/**
 * App
 * @return {Component}
 */
class Home extends Component {
  /**
   * Login
   */
  login() {
    this.props.auth.login();
  }
  /**
   * Render
   * @return {Component} component
   */
  render() {
    const {isAuthenticated} = this.props.auth;
    return (
      <div>
        {
          isAuthenticated() && (
            <App />
          )
        }
        {
          !isAuthenticated() && (
            <div></div>
          )
        }
      </div>
    );
  }
}

export default Home;
