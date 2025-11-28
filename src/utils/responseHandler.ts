import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const sendSuccessResponse = (res: Response, data: unknown, { message = null, status = StatusCodes.OK } = {}) => {
    const payload = {
        success: true,
    }
    if(message !== null && message !== undefined) payload["message"] = message;
    payload["data"] = data;
    return res.status(status).json(payload);
}

export const sendErrroResponse = (res: Response, message, { data = null, status = StatusCodes.INTERNAL_SERVER_ERROR } = {}) => {
    const payload = {
        success: false,
        message: message
    }
    if(data !== null && data !== undefined) payload["data"] = data;
    return res.status(status).json(payload);
}