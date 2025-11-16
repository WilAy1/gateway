import axios from 'axios';
import crypto from 'crypto';
import {TransactionDB}  from '../../db/transactions/transactions.db';
import { GWObject, isEmpty, removeKeys } from '../../utils/utils';
import Table from '../../db/query';

interface WebhookData {
    event: WebhookEvent,
    payload: GWObject
}

enum WebhookEvent {
    TRANSACTION_COMPLETED = 'transaction_completed',
    TRANSACTION_CANCELLED = 'transaction_cancelled',

}


class Webhook {
    private webhookUrl: string
    private webhookTable: Table;
    private logTable: Table;
    private secret: string;
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
        this.webhookTable = new Table('webhook');
        this.logTable = new Table('webhook_log');
    }

    private async hasWebhook(){
        const result = await this.webhookTable.select({
            cols: ['url', 'secret_key'],
            conditions: {
                compulsory: [
                    { key: 'user_id', value: this.userId },
                    { key: 'status', value: 'active' }
                ]
            }
        });

        if (isEmpty(result)){
            return false;
        }

        this.webhookUrl = result[0]['url'];
        this.secret = result[0]['secret_key'];

        return true;
    }

    private generateSignature(data: WebhookData): string {
        const payload = JSON.stringify(data);
        return crypto
            .createHmac('sha256', this.secret)
            .update(payload)
            .digest('hex');
    }


    private log(){

    }

    private async send(data: WebhookData) {
        if (!this.webhookUrl || !this.secret) {
            const webhookCheck = await this.hasWebhook();
            if(!webhookCheck) {
                return;
            }
        }
        const signature = this.generateSignature(data);

        try {
            const response = await axios.post(this.webhookUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                },
            });
            console.log('Webhook sent successfully:', response.data);
        } catch (error) {
            console.error('Error sending webhook:', error);
        }
    }
    
    async sendWebhook(data: WebhookData, retries: number = 5){
      let attempt = 0;
        
      const send = async () => {
        attempt += 1;
        try {
          await this.send(data);
        } catch (error) {
          if (attempt <= retries) {
            console.log(`Retrying... Attempt ${attempt}`);
            await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000)); // Exponential backoff
            await send();
          } else {
            console.error('Max retries reached, failed to send webhook');
          }
        }
      };

      send();
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
        await this.sendWebhook(webhookData);
    }

}

export { Webhook, WebhookData, WebhookEvent };