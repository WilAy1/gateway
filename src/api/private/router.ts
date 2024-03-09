import express from 'express';
import { authenticate } from './middleware';
export const privateRouter = express.Router();

// Apply authentication middleware to all routes in this router
privateRouter.use(authenticate);

// Private endpoint
privateRouter.get('/privateEndpoint', (req, res) => {
    // This endpoint requires authentication
    res.json({ message: 'Private endpoint accessed successfully' });
});
