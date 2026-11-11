-- Remove duplicate unique indexes left behind by Hibernate's ddl-auto=update.
--
-- Before Flyway owned the schema, Hibernate created unique constraints with
-- generated names. V1 later created equivalent ux_* unique indexes, so the
-- database maintained two identical indexes for the same columns. The
-- canonical ux_* indexes below are the ones we keep.
--
-- ALTER TABLE ... DROP CONSTRAINT is required on PostgreSQL because an index
-- backing a constraint cannot be dropped directly. DROP INDEX afterwards
-- handles databases where the generated index is standalone. IF EXISTS makes
-- the whole migration a no-op on fresh databases.

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_nickname ON users (nickname);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_qr_receive ON users (qr_receive);
CREATE UNIQUE INDEX IF NOT EXISTS ux_contacts_owner_contact_idx ON contacts (owner_id, contact_id);

ALTER TABLE users DROP CONSTRAINT IF EXISTS uk2ty1xmrrgtn89xt7kyxx6ta7h;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uk6dotkott2kjsp8vw4d0m25fb7;
ALTER TABLE users DROP CONSTRAINT IF EXISTS ukhu96nnymjtmk62172oe45i5h6;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS ukdj52su58a7obxcpqwm1xpjx42;

DROP INDEX IF EXISTS uk2ty1xmrrgtn89xt7kyxx6ta7h;
DROP INDEX IF EXISTS uk6dotkott2kjsp8vw4d0m25fb7;
DROP INDEX IF EXISTS ukhu96nnymjtmk62172oe45i5h6;
DROP INDEX IF EXISTS ukdj52su58a7obxcpqwm1xpjx42;
