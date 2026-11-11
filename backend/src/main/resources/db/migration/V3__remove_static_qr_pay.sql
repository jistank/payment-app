-- QR codes: keep only the stable receive code.
--
-- A per-user "pay code" shown by its owner was removed. Payments are initiated
-- by scanning the recipient's receive code, so the payer never needs to show a
-- code of their own. Dropping the column also removes a permanent credential
-- that could be reused if photographed.

DROP INDEX IF EXISTS ux_users_qr_pay;
ALTER TABLE users DROP COLUMN IF EXISTS qr_pay;
