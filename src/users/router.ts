import express from 'express';
import { onboardingRouter } from './onboarding.users';
import { excludeFromAuth } from './middleware';
import { tokenRouter } from './settings/generate_token.router';

export const userRouter = express.Router();


userRouter.use(excludeFromAuth(['/register', '/verify-user', '/login']));
userRouter.use('/', onboardingRouter);
userRouter.use('/', tokenRouter);
