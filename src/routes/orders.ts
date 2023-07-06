import express from 'express';
const router = express.Router();
import * as orderControllers from '../controllers/orders';
import verifyToken from '../middleware/auth';

router.get('/', verifyToken, orderControllers.findAll);
router.get('/:orderId', verifyToken, orderControllers.findOne);
router.get('/user/:userId', verifyToken, orderControllers.findByUser);
router.post('/', verifyToken, orderControllers.create);
router.put('/:orderId', verifyToken, orderControllers.update);
router.delete('/:orderId', verifyToken, orderControllers.deleteByUserId);

module.exports = router;