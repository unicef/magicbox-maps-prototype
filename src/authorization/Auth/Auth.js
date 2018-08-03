import history from '../history'
import auth0 from 'auth0-js'
import {AUTH_CONFIG} from './auth0-variables'

/**
 * Class to deal with login and authentication
 */
export default class Auth {
    /**
   * Auth class constructor
   */
    constructor() {
        this.login = this.login.bind(this)
        this.logout = this.logout.bind(this)
        this.handleAuthentication = this.handleAuthentication.bind(this)
        this.isAuthenticated = this.isAuthenticated.bind(this)
        this.auth0 = new auth0.WebAuth({
            domain: AUTH_CONFIG.domain,
            clientID: AUTH_CONFIG.clientId,
            redirectUri: AUTH_CONFIG.callbackUrl,
            audience: `https://${AUTH_CONFIG.domain}/userinfo`,
            responseType: 'token id_token',
            scope: 'openid'
        })
    }

    /**
   * Login method
   */
    login() {
        this.auth0.authorize()
    }

    /**
   * Handle authentication
   */
    handleAuthentication() {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult)
                history.replace('/home')
            } else if (err) {
                history.replace('/home')
                alert(`Error: ${err.error}. Check the console for further details.`)
            }
        })
    }

    /**
   * Set session
   *
   * @param {object} authResult Authorization result
   */
    setSession(authResult) {
        // Set the time that the access token will expire at
        let expiresAt = JSON.stringify((authResult.expiresIn * 1000) +
      new Date().getTime())
        localStorage.setItem('access_token', authResult.accessToken)
        localStorage.setItem('id_token', authResult.idToken)
        localStorage.setItem('expires_at', expiresAt)
        // navigate to the home route
        history.replace('/home')
    }

    /**
   * Deauthenticate user
   */
    logout() {
        // Clear access token and ID token from local storage
        localStorage.removeItem('access_token')
        localStorage.removeItem('id_token')
        localStorage.removeItem('expires_at')
        // navigate to the home route
        history.replace('/home')
    }

    /**
   * Check if user is authenticated
   *
   * @return {boolean}
   */
    isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        let expiresAt = JSON.parse(localStorage.getItem('expires_at'))
        return new Date().getTime() < expiresAt
    }
}
