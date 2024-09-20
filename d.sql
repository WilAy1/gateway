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
	wallet_id UUID NOT NULL,
	user_id UUID NOT NULL,
	amount NUMERIC(20, 6) NOT NULL CHECK (amount >= 0),
	activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('credit', 'debit')),
	reference_id UUID NOT NULL,
	reference_origin VARCHAR(64) NOT NULL,
	reason TEXT,
	created TIMESTAMP
);*/

INSERT INTO wallet (user_id, balance) VALUES ('54c91f1c-9ae9-45aa-9825-c16800f7881f', 0);