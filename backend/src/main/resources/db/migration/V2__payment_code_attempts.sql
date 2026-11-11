-- Brute-force protection for the 6-digit payment code.
--
-- The payment code authorizes money transfers, so unlimited online guessing
-- would be dangerous. Failed attempts are counted and the account is
-- temporarily locked after too many wrong codes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_code_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_code_locked_until TIMESTAMP;
