import express from 'express';
import { signup, login, getUser, authenticate } from '../controllers/authController';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get("/user", authenticate, getUser);


export default router;
