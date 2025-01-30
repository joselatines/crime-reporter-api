import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getAuthenticatedUser } from '../controllers/users.controller';
import { protectRoute } from '../middlewares';

const router = express.Router();

router.get('/', protectRoute, getUsers);

router.get('/me', protectRoute, getAuthenticatedUser);

router.get('/:id', protectRoute, getUserById);

router.post('/', protectRoute, createUser);

router.put('/:id', protectRoute, updateUser);

router.delete('/:id', protectRoute, deleteUser);

export default router;