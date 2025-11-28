import { isEmpty, isValidURL } from "../../utils/utils";
import Table from "../query";
import crypto from 'crypto';
// import { ConditionChild } from "../../interfaces/db.interface";


export default class WebhookDB {
    private webhookTable: Table;
    private logTable: Table;
    private eventsTable: Table;
    private userId: string;
    constructor(userId?: string){
        this.webhookTable = new Table("webhook_endpoints");
        this.logTable = new Table("webhook_deliveries");
        this.eventsTable = new Table("webhook_events");
        this.userId = userId;
    }


    private generateSecret() {
        return crypto.randomBytes(32).toString('hex');
    }

    async createWebhook({url, events}){
        try {
            if(!this.userId) throw new Error("User id is required");
            
            if(!isValidURL(url) || isEmpty(events)) return false;
            const success = await this.webhookTable.insert(
                [
                    "user_id",
                    "url",
                    "events",
                    "secret",
                    "status", 
                ],
                [
                    this.userId,
                    url,
                    JSON.stringify(events),
                    this.generateSecret(),
                    "active"
                ],
                {
                    returnColumn: "id"
                }
            );
  
            if(!success) return false;
            return success["id"];
        }
        catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }
    async updateWebhook({id, url = null, events = null, status = null}){
        try {
            if(!this.userId) throw new Error("User id is required");
            const VALID_STATUSES = ["active", "disabled"];
            if(!url && !events && !status) return false;
            if((url && !isValidURL(url)) || (events && isEmpty(events)) || (status && !VALID_STATUSES.includes(status))) return false;
            const keys = [];
            const values = [];
            if(url) {
                keys.push("url");
                values.push(url);
            }
            if(events) {
                keys.push("events");
                values.push(JSON.stringify(events));
            }
            if(status) {
                keys.push("status");
                values.push(status);
            }
            return await this.webhookTable.update(keys, values, {
                compulsory: [
                    {
                        key: "id",
                        value: id
                    },
                    {
                        key: "user_id",
                        value: this.userId
                    }
                ]
            });
        }
        catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async deleteWebhook({id}){
        if(!this.userId) throw new Error("User id is required");
        try {
            return await this.webhookTable.delete({
                compulsory: [
                    {
                        key: "id",
                        value: id
                    },
                    {
                        key: "user_id",
                        value: this.userId
                    }
                ]
            });
        }
        catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    async fetchWebhooks({webhookId = null, event = null} = {}) {
        if(!this.userId) throw new Error("User id is required");
        try {
            const compulsoryConditions = [
                {
                    key: "user_id",
                    value: this.userId
                }
            ];
            if(webhookId) {
                compulsoryConditions.push({
                    key: "id",
                    value: webhookId
                });
            }
            if(event){
                const query = await this.webhookTable.customQuery("SELECT * FROM webhook_endpoints WHERE user_id=$1 AND events @> $2::jsonb", [this.userId, JSON.stringify([event])]);
                return query['rows'];
            }
            const webhooks = await this.webhookTable.select({
                cols: [
                    "id",
                    "url",
                    "events",
                    "secret",
                    "status",           
                ],
                conditions: {
                    compulsory: compulsoryConditions
                }
            });
            return webhooks;
        }
        catch(error) {
            console.error(error);
            throw new Error(error);
        }
    }
     
    async logWebhook({webhookId, eventId, status, attemptTime}) {
        try {
            await this.logTable.insert(
                [
                    "webhook_id",
                    "event_id",
                    "attempt_count",
                    "status",
                    "last_attempt_at"
                ], 
                [
                    webhookId,
                    eventId,
                    1,
                    status,
                    attemptTime
                ]
            );
        }
        catch (error) {
            console.error(error);
        }
    }
    async updateLog({webhookId, attemptCount, status, attemptTime, responseStatusCode, responseBody, errorMessage, duration}){
        try {
            await this.logTable.update(
                [
                    "attempt_count",
                    "status",
                    "last_attempt_at",
                    "response_status_code",
                    "response_body",
                    "error_message",
                    "duration_ms"
                ],
                [
                    attemptCount,
                    status,
                    attemptTime,
                    responseStatusCode,
                    responseBody,
                    errorMessage,
                    duration
                ],
                {
                    compulsory: [
                        {
                            key: "webhook_id",
                            value: webhookId
                        }
                    ]
                }
            );
        }
        catch(error){
            console.error(error);
        }
    }

    async createEvent({eventType, payload}){
        try {
            const result = await this.eventsTable.insert(
                [
                    "event_type",
                    "payload"
                ],
                [
                    eventType,
                    payload
                ],
                {
                    returnColumn: "id"
                }
            );

            return result["id"];
        }
        catch (error) {
            console.error(error);
            throw Error(error);
        }
    }

    // async fetchEvents({eventType = null}){
    //     try {
    //         const compulsoryConditions: ConditionChild[] = [];
    //         if(eventType){
    //             compulsoryConditions.push({
    //                 key: "event_type",
    //                 value: ""
    //             })
    //         }
    //         await this.eventsTable.select({conditions: {
    //             compulsory: compulsoryConditions
    //         }})
    //     }
    //     catch {
            
    //     }
    // }
}

// id
// user_id
// name
// url
//events TEXT[]
// secret 
// createdat...
//headers



//log
