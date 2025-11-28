import { GWObject } from '../utils/utils';


interface WebhookData {
    event: WebhookEvent;
    payload: GWObject;
}

enum WebhookEvent {
    TRANSACTION_CREATED = 'transaction.created',
    TRANSACTION_COMPLETED = 'transaction.completed',
    TRANSACTION_CANCELLED = 'transaction.cancelled',
    CUSTOMER_CREATED = 'customer.created',
    CUSTOMER_DELETED = 'customer.deleted'
}

export { WebhookData, WebhookEvent };