import { StatusCodes } from 'http-status-codes';
import { authRegister, authenticateLogin, verifyUser } from '../db/users/auth.db';
import { analyzeRequestParams } from '../utils/utils';
import express from 'express';
import { UseLoginResponse } from '../interfaces/auth.users.interface';

export const onboardingRouter = express.Router();

onboardingRouter.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authRegister(email, password);
        if (!result.success) {
            if (result.emailExists) {
                return res.status(StatusCodes.CONFLICT).json({ error: result.message });
            }
            return res.status(StatusCodes.BAD_GATEWAY).json({ error: result.message });
        }
        return res.status(StatusCodes.OK).json({ success: result.message, hash: result.hash });
    }
    catch (error) {
        console.error("Error in /register route:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});


onboardingRouter.post('/verify-user', async (req, res) => {
    try {
        const { email, hash, code } = req.body;

        const result = await verifyUser(email, hash, code);

        if (!result.success) {
            return res.status(StatusCodes.FORBIDDEN).json({ error: result.message });
        }
        return res.status(StatusCodes.OK).json({ success: result.message });
    }
    catch (error) {
        console.error("Error in /verify-user route:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});


onboardingRouter.post('/login', async (req, res) => {
    try {
        const { email, password, device_id } = req.body;

        const { ip, userAgent, deviceType } = analyzeRequestParams(req);


        let result : UseLoginResponse;

        if (email && password && device_id) {
            result = await authenticateLogin({
                email: email,
                password: password,
                deviceId: device_id,
                ip: ip,
                userAgent: userAgent,
                deviceType: deviceType
            });
        }
        else {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Failed to process request" });
        }


        if (result && !result.success) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: result.message });
        }

        return res.status(StatusCodes.OK).json({ success: result.success, token: result.token });

    }
    catch (error) {
        console.error("Error in /login route:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
