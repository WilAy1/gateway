import { StatusCodes } from "http-status-codes";
import { sendErrroResponse, sendSuccessResponse } from "../../../utils/responseHandler";
import WebhookDB from "../../../db/webhook/webhook.db";
import { isEmpty, isValidURL } from "../../../utils/utils";

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
    try {
        const { userId } = req["user"];
        const { id } = req.params;
        const { url, events, status } = req.body;
        if(!id && (!isValidURL(url) || !events || !status)) return sendErrroResponse(res, "Inalid request params", { status: StatusCodes.BAD_REQUEST });
        const webhookDB = new WebhookDB(userId);
        const successs = await webhookDB.updateWebhook({id, url, events, status});
        if(!successs) return sendErrroResponse(res, "Failed to update webhook");
        const webhook = await webhookDB.fetchWebhooks({ webhookId: id });
        return sendSuccessResponse(res, webhook[0], { message: "webhook updated" });

    }   
    catch (error) {
        console.error(error);
        return sendErrroResponse(res, "Internal server error");
    }
}

export async function fnDeleteWebhookEndpoint(req, res) {
    try {
        const { userId } = req["user"];
        const { id } = req.params;
        const webhookDB = new WebhookDB(userId);
        const success = await webhookDB.deleteWebhook({id});
        if(!success) return sendErrroResponse(res, "Failed to delete webhook");
        return sendSuccessResponse(res, {}, { message: "webhook deleted" });
    }
    catch (error) {
        console.error(error);
        return sendErrroResponse(res, "Internal server error");
    }
}


export async function fnFetchWebhooks(req, res){
    try {
        const { userId } = req["user"];
        const webhookDB = new WebhookDB(userId);
        const webhooks = await webhookDB.fetchWebhooks();
        
        return sendSuccessResponse(res, webhooks || [], { message: "success" });
    }
    catch (error) {
        console.error(error);
        return sendErrroResponse(res, "Internal server error");
    }
}