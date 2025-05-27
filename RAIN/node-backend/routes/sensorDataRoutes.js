var express = require('express');
var router = express.Router();
var sensorDataController = require('../controllers/sensorDataController.js');

/*
 * GET
 */
router.get('/', sensorDataController.list);

/*
 * GET
 */
router.get('/:id', sensorDataController.show);

/*
 * POST
 */
router.post('/', sensorDataController.create);

/*
 * PUT
 */
router.put('/:id', sensorDataController.update);

/*
 * DELETE
 */
router.delete('/:id', sensorDataController.remove);

module.exports = router;
