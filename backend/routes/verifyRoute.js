import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/check', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Token valide', user: req.user });
});

export default router;
