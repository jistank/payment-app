-- Indexes for the remaining foreign-key lookup.
--
-- Deleting an account removes every contact row where the user appears either
-- as owner or as contact. The existing unique index on (owner_id, contact_id)
-- covers the owner side, but PostgreSQL/H2 cannot use its second column alone,
-- so the contact side would scan the whole table. This index covers it.

CREATE INDEX IF NOT EXISTS ix_contacts_contact ON contacts (contact_id);
