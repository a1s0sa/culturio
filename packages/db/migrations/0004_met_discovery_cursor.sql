ALTER TABLE ingestion_discovery_state ADD COLUMN cursor TEXT;
UPDATE ingestion_discovery_state SET offset = 0 WHERE source = 'met';
