import { StatusCodes } from "http-status-codes";
import { sendErrroResponse, sendSuccessResponse } from "../../../utils/responseHandler";
import WebhookDB from "../../../db/webhook/webhook.db";
import { isEmpty } from "../../../utils/utils";

export async function fnCreateWebhookEndpoint(req, res) {
    try {
        const { userId } = req['user'];

        const { url, events } = req.body;
        if(!url || !events || isEmpty(events)) return sendErrroResponse(res, "Inalid request params", { status: StatusCodes.BAD_REQUEST });

        const webhookDB = new WebhookDB(userId);
        const webhookId = await webhookDB.createWebhook({
            url: url,
            events: events
        });

        if(!webhookId) return sendErrroResponse(res, "Interal server error");
        const webhook = await webhookDB.fetchWebhooks({ webhookId: webhookId });
        return sendSuccessResponse(res, webhook[0], { message: "success" });

    }
    catch(error) {
        console.error(error);
        return sendErrroResponse(res, "Internal server error");
    }
}

export async function fnUpdateWebhhokEndpoint(req, res) {

}

export async function fnDeleteWebhookEndpoint(req, res) {
    
}