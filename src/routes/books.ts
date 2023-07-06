import express from 'express';
const router = express.Router();
import * as bookControllers from '../controllers/books';
import verifyToken from '../middleware/auth';
import upload from '../middleware/upload';

router.get('/', bookControllers.findAll);
router.get('/user/:userId', verifyToken, bookControllers.findByUser);
router.get('/:bookId', bookControllers.findOne);
router.post('/', verifyToken, upload.single('file'), bookControllers.create);
router.put('/:bookId', verifyToken, upload.single('file'), bookControllers.update);
router.delete('/:bookId', verifyToken, bookControllers.deleteByBookId);

module.exports = router;