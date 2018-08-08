module.exports = {
  auth_client_id: process.env.REACT_APP_AUTH_CLIENT_ID || 'AUTH0_CLIENT_ID',
  auth_callback_url: process.env.REACT_APP_AUTH_CALLBACK_URL || 'http://localhost:3000/authorization/callback',
  login_required: process.env.REACT_APP_LOGIN_REQUIRED || true,
  accepted_roles: ['admin', 'unicef'],
  app_name: 'Magicbox Maps',
  opacity: 0.8,
  acceptable_percent: 80,
  map: {
    lng:  -74.2973,
    lat: 4.5709,
    zoom: 5
  }
}
