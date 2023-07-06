import express from 'express';
const router = express.Router();
import * as cartControllers from '../controllers/carts';
import verifyToken from '../middleware/auth';

router.get('/', verifyToken, cartControllers.findAll);
router.get('/:cartId', verifyToken, cartControllers.findOne);
router.get('/user/:userId', verifyToken, cartControllers.findOneByUser);
router.post('/', verifyToken, cartControllers.updateCart);
router.put('/:cartId', verifyToken, cartControllers.updateCart);
router.delete('/:cartId', verifyToken, cartControllers.deleteByCartId);

module.exports = router;