/* eslint-disable @typescript-eslint/no-unused-vars */
import Table from "../query";

class WebhookDB {
    private webhookTable: Table;
    private userId: string;
    constructor(userId: string){
        this.webhookTable = new Table("webhook");
        this.userId = userId;
    }

    private async createWebhook({url, events}){
        
    }
}