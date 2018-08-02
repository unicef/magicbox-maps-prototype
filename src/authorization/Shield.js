// eslint-disable-next-line no-unused-vars
import React, {Component} from 'react';
import {Navbar, Button} from 'react-bootstrap';
import '../App.css';
/**
 * App
 * @return {Component}
 */
class App extends Component {
  /**
   * Route
   * @param  {Object} route
   */
  goTo(route) {
    this.props.history.replace(`/${route}`)
  }
  /**
   * Login
   */
  login() {
    this.props.auth.login();
  }

  /**
   * Logout
   */
  logout() {
    this.props.auth.logout();
  }

  /**
   * Render
   * @return {Component} component
   */
  render() {
    const {isAuthenticated} = this.props.auth;
    return (
      <div>
        <div className="landing-screen-navbar">
            <p className="landing-screen-navbar-title">UNICEF Office of Innovation</p>
        </div>
            {
              !isAuthenticated() && (
                <div className="landing-screen-info">
                  <p>Welcome to the [TITLE OF MAP PROJECT HERE].</p>
                  <br></br>
                  <br></br>
                  <br></br>
                  <p>This project is a visualization tool that provides data to help inform humanitarian responses.</p>
                  <br></br>
                  <p>Please login to continue.</p>
                  <Button
                    className="btn-login"
                    onClick={this.login.bind(this)}
                  >
                    Log In
                  </Button>
                </div>
              )
            }
            {
              isAuthenticated() && (
                <Button
                  id="qsLogoutBtn"
                  bsStyle="primary"
                  className="btn-margin"
                  onClick={this.logout.bind(this)}
                >
                  Log Out
                </Button>
              )
            }
      </div>
    );
  }
}

export default App;
