var express = require('express');
var router = express.Router();
var landmarkController = require('../controllers/landmarkController.js');

/*
 * GET
 */
router.get('/', landmarkController.list);

/*
 * GET
 */
router.get('/:id', landmarkController.show);

/*
 * POST
 */
router.post('/', landmarkController.create);

/*
 * PUT
 */
router.put('/:id', landmarkController.update);

/*
 * DELETE
 */
router.delete('/:id', landmarkController.remove);

module.exports = router;
