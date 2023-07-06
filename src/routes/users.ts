import express from 'express';
const router = express.Router();
import * as userControllers from '../controllers/users';
import verifyToken from '../middleware/auth';

router.get('/', userControllers.findAll);
router.get('/:userId', userControllers.findOne);
router.post('/login', userControllers.login);
router.post('/', verifyToken, userControllers.create);
router.put('/:userId', verifyToken, userControllers.update);
router.delete('/:userId', verifyToken, userControllers.deleteByUserId);

module.exports = router;
