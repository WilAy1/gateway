CREATE TABLE webhook (
    user_id UUID NOT NULL,
    secret_key TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('active', 'inactive')),
    url TEXT NOT NULL,  -- Increase URL length
    events JSONB NOT NULL, -- transaction statuses, settlements, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of updates
    PRIMARY KEY (user_id)
);

CREATE TABLE webhook_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    webhook_id UUID NOT NULL,  -- Optional: to support multiple webhooks per user
    event VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('success', 'failure', 'pending', 'retrying')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES webhook(user_id),
    FOREIGN KEY (webhook_id) REFERENCES webhook(user_id)  -- Optional, based on webhook_id logic
);

-- Indexes for frequent filtering
CREATE INDEX idx_webhook_status ON webhook (status);
CREATE INDEX idx_webhook_log_status ON webhook_log (status);


CREATE TABLE wallet (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    balance NUMERIC(20, 6) NOT NULL CHECK (balance >= 0),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    others JSONB
);

CREATE TABLE wallet_activity (
	activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	coin_id UUID NOT NULL,
	user_id UUID NOT NULL,
	amount NUMERIC(20, 6) NOT NULL CHECK (amount >= 0),
	activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('credit', 'debit')),
	reference_id UUID NOT NULL,
	reference_origin VARCHAR(64) NOT NULL,
	reason TEXT,
	created TIMESTAMP
);


CREATE TABLE wallet (
	user_id UUID NOT NULL,
    coin_id UUID NOT NULL,
    balance NUMERIC(20, 6) NOT NULL CHECK (balance >= 0),
	created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, coin_id),  -- Ensures no duplicate coin for a user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (coin_id) REFERENCES available_coins(coin_id)
);
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;  -- Set updated_at to the current timestamp
    RETURN NEW;  -- Return the updated row
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_wallet_timestamp BEFORE UPDATE ON wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_coin_id ON wallet(coin_id);


*/

INSERT INTO wallet (user_id, balance) VALUES ('54c91f1c-9ae9-45aa-9825-c16800f7881f', 0);








CREATE TABLE settlement_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chain_id UUID NOT NULL REFERENCES available_chains(chain_id) ON DELETE CASCADE,
    coin_id UUID NOT NULL REFERENCES available_coins(coin_id) ON DELETE CASCADE,
    address TEXT NOT NULL,         
    tag_or_memo TEXT,             

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	
	    CONSTRAINT unique_business_chain_coin UNIQUE (user_id, chain_id, coin_id)
);