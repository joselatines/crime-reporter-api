import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getAuthenticatedUser } from '../controllers/users.controller';
import { protectRoute } from '../middlewares';

const router = express.Router();

router.get('/', getUsers);
/* router.get('/', protectRoute, getUsers); */

router.get('/me', protectRoute, getAuthenticatedUser);

router.get('/:id',getUserById);

router.post('/', createUser);
/* router.post('/', protectRoute, createUser); */

router.put('/:id', updateUser);

router.delete('/:id', protectRoute, deleteUser);

export default router;