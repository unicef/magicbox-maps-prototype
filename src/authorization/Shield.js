// eslint-disable-next-line no-unused-vars
import React, {Component} from 'react';
import {Navbar, Button} from 'react-bootstrap';
import '../css/App.css';
import '../css/auth.css';
/**
 * App
 * @return {Component}
 */
class Shield extends Component {
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
        <a href="https://www.unicef.org" target="_blank" rel="noopener noreferrer" alt="Unicef" className="landing-screen-navbar-logo"></a>
            <p className="landing-screen-navbar-title">
        {
          isAuthenticated() && (

              <span onClick={this.logout.bind(this)}>Log out</span>

          )}
            </p>
        </div>
          {
            !isAuthenticated() && (
              <div className="landing-screen-info">
                <p>Welcome to Magicbox Maps.</p>
                <br></br>
                <br></br>
                <br></br>
                <p>This project is a visualization tool that provides data to help inform humanitarian response.</p>
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
      </div>
    );
  }
}

export default Shield;
