/* global module, process */

module.exports = {
    auth_client_id: process.env.REACT_APP_AUTH_CLIENT_ID || 'APP_AUTH_CLIENT_ID',
    auth_callback_url: process.env.REACT_APP_AUTH_CALLBACK_URL || 'http://localhost:3000/authorization/callback',
    login_required: process.env.REACT_APP_LOGIN_REQUIRED || true
}
