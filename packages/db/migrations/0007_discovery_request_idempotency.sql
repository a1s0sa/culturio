ALTER TABLE ingestion_runs ADD COLUMN request_id TEXT;
ALTER TABLE ingestion_runs ADD COLUMN request_result TEXT;
CREATE UNIQUE INDEX ingestion_runs_request_id_uq ON ingestion_runs(request_id) WHERE request_id IS NOT NULL;
