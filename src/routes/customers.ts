import express from 'express';
const router = express.Router();
import * as customerControllers from '../controllers/customers';
import verifyToken from '../middleware/auth';

router.get('/', verifyToken, customerControllers.findAll);
router.get('/:id', verifyToken, customerControllers.findOne);
router.get('/user/:id', verifyToken, customerControllers.findByUser);
router.post('/', verifyToken, customerControllers.create);
router.put('/:id', verifyToken, customerControllers.update);
router.delete('/:id', verifyToken, customerControllers.deleteById);

module.exports = router;