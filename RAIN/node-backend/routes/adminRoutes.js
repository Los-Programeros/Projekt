var express = require('express');
var router = express.Router();

/* GET Admin Panel - full page */
router.get('/', function(req, res, next) {
  res.render('admin', {
    layout: false, // 🚀 disables layout.hbs
    users: [
      { id: 'user1', name: 'Alice' },
      { id: 'user2', name: 'Bob' },
      { id: 'user3', name: 'Charlie' }
    ]
  });
});

module.exports = router;
