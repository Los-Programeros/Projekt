var express = require('express');
var router = express.Router();
var userActivityController = require('../controllers/userActivityController.js');

/*
 * GET
 */
router.get('/', userActivityController.list);

/*
 * GET
 */
router.get('/:id', userActivityController.show);

/*
 * POST
 */
router.post('/', userActivityController.create);

/*
 * PUT
 */
router.put('/:id', userActivityController.update);

/*
 * DELETE
 */
router.delete('/:id', userActivityController.remove);

module.exports = router;
