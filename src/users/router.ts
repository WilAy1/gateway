import express from 'express';
import { onboardingRouter } from './onboarding.users';
import { excludeFromAuth } from './middleware';
import { userTransactionRouter } from './transactions/router';
import { settingsRouter } from './settings/router';

export const userRouter = express.Router();


userRouter.use(excludeFromAuth(['/register', '/verify-user', '/login']));
userRouter.use('/', onboardingRouter);
userRouter.use('/settings', settingsRouter);
userRouter.use('/transaction', userTransactionRouter);
