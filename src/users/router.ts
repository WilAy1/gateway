import express from 'express';
import { onboardingRouter } from './onboarding.users';
import { excludeFromAuth } from './middleware';

export const userRouter = express.Router();


userRouter.use(excludeFromAuth(['/register', '/verify-user', '/login']));
userRouter.use('/', onboardingRouter);

