// Simple one-liner: use puglite angular-webpack integration
// For development: use local package
module.exports = require('../packages/pug/angular-webpack')();

// For production (after publishing to npm):
// module.exports = require('puglite/angular-webpack')();
