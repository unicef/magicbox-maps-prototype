module.exports = {
  auth_client_id: process.env.REACT_APP_AUTH_CLIENT_ID || 'REACT_APP_AUTH_CLIENT_ID',
  auth_callback_url: process.env.REACT_APP_AUTH_CALLBACK_URL || 'http://localhost:3000/authorization/callback',
  login_required: process.env.REACT_APP_LOGIN_REQUIRED || false,
  accepted_roles: ['admin'],
  app_name: 'Magicbox Maps',
  opacity: 0.8,
  acceptable_percent: 60,
  map: {
    lng: 23.684203,
    lat: -3.078111,
    zoom: 5
  }
}
