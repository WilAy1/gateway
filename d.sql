/*CREATE TABLE wallet (
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