import axios from 'axios';
import crypto from 'crypto';
import {TransactionDB}  from '../../db/transactions/transactions.db';
import { GWObject, isEmpty, removeKeys } from '../../utils/utils';
import WebhookDB from '../../db/webhook/webhook.db';
import { WebhookData, WebhookEvent } from '../../interfaces/webhook';

class Webhook {
    private userId: string;
    private webhookDB: WebhookDB;


    constructor(userId: string) {
        this.userId = userId;
        this.webhookDB = new WebhookDB(this.userId);
    }

    // private async hasWebhook(){
    //     const webhooks = await
    //     const result = await .select({
    //         cols: ['url', 'secret_key'],
    //         conditions: {
    //             compulsory: [
    //                 { key: 'user_id', value: this.userId },
    //                 { key: 'status', value: 'active' }
    //             ]
    //         }
    //     });

    //     if (isEmpty(result)){
    //         return false;
    //     }

    //     this.webhookUrl = result[0]['url'];
    //     this.secret = result[0]['secret_key'];

    //     return true;
    // }

    private generateSignature(data: WebhookData, secret): string {
        const payload = JSON.stringify(data);
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }


    private log(){

    }

    private async send(data: WebhookData, url, secret) {
        // const webhooks = await this.webhookDB.fetchWebhooks({event: data.event});
        // if(isEmpty(webhooks)) return;

        // // if (!this.webhookUrl || !this.secret) {
        // //     const webhookCheck = await this.hasWebhook();
        // //     if(!webhookCheck) {
        // //         return;
        // //     }
        // // }

        // for(const webhook of webhooks) {
        //     const signature = this.generateSignature(data, webhook['secret']);
        try {
            const signature = this.generateSignature(data, secret);
            console.log(url);
            const response = await axios.post(url, data, {
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // Accept 2xx, 3xx, 4xx
                },
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                },
            });
            return response;
        } catch (error) {
            console.error('Error sending webhook:', error);
        }
        // }
    }
    
    async sendWebhook(data: WebhookData){
        try {
            const webhooks = await this.webhookDB.fetchWebhooks({event: data.event});
            if(isEmpty(webhooks)) return;

            const promises = webhooks.map(webhook => this.sebdWebhookWithRetry(webhook, data))
            await Promise.all(promises);
        }
        catch (error) {
            console.log(error);
        }
    }

    async sebdWebhookWithRetry(webhook, data: WebhookData){
        const retries = 5;
        const eventId = await this.webhookDB.createEvent({eventType: data.event, payload: data.payload});
        let date = new Date();
        await this.webhookDB.logWebhook({
            webhookId: webhook['id'],
            eventId: eventId,
            status: 'pending',
            attemptTime: date.toISOString()
        });
        let attempt = 0;
        let success = false;
        while (attempt< retries && !success){
            attempt++;
            const start = Date.now();
            try {
                date = new Date();
                const response = await this.send(data, webhook['url'], webhook['secret']);
                const duration = Date.now() - start;
                if(response.status === 200) {
                    success = true;
                    await this.webhookDB.updateLog({
                        webhookId: webhook['id'],
                        status: "success",
                        attemptCount: attempt,
                        attemptTime: date.toISOString(),
                        responseStatusCode: response.status,
                        responseBody: response.data,
                        errorMessage: "",
                        duration: duration
                    });
                }
                else {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                }
            } 
            catch (error) {
                console.log(error);
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
            
        }
        if(!success) {
            date = new Date();
            await this.webhookDB.updateLog({
                webhookId: webhook['id'],
                status: "failed",
                attemptCount: attempt,
                attemptTime: date.toISOString(),
                responseStatusCode: null,
                responseBody: null,
                errorMessage: null,
                duration: null
            });
            console.error('Max retries reached, failed to send webhook');
        }
    }

    async sendTransaction(transactionId: string, event: WebhookEvent){

        const transactionDb =  new TransactionDB(this.userId);
        const transaction = await transactionDb.fetchTransaction(transactionId);
        const updatedTransaction = removeKeys(transaction as GWObject, 
            [
            'issuer_id',
            'description',
            'customer_id',
            "customer_email",
            "customer_metadata",
            "application_fee",
            "fee_denomination",
            "metadata",
            "device_type",
            "useragent",
            "ipaddress" 
        ]);
        const webhookData: WebhookData = {
            event: event,
            payload: updatedTransaction
        };
        this.sendWebhook(webhookData);
    }

}

export { Webhook };