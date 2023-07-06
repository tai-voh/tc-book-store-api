const express = require('express');
const router = express.Router();
const bookControllers = require('../controllers/books');

router.get('/', bookControllers.findAll);
router.get('/:bookId', bookControllers.findOne);
router.post('/', bookControllers.create);
router.put('/:bookId', bookControllers.updateByBookId);
router.delete('/:bookId', bookControllers.deleteByBookId);

module.exports = router;