var express = require('express');
var router = express.Router();
const userControllers = require('../controllers/users');

/* GET users listing. */
router.get('/', userControllers.findAll);
router.get('/:userId', userControllers.findOne);
router.post('/login', userControllers.login);
router.post('/', userControllers.create);
router.put('/:userId', userControllers.updateByUserId);
router.delete('/:userId', userControllers.deleteByUserId);

module.exports = router;
