-- SQLite has no native enum type. Drizzle provides compile-time unions, and these
-- triggers enforce the same allowed values for writes made outside typed code.
CREATE TRIGGER artifact_sources_institution_insert
BEFORE INSERT ON artifact_sources
WHEN NEW.institution NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid artifact source institution');
END;

CREATE TRIGGER artifact_sources_institution_update
BEFORE UPDATE OF institution ON artifact_sources
WHEN NEW.institution NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid artifact source institution');
END;

CREATE TRIGGER ingestion_runs_source_insert
BEFORE INSERT ON ingestion_runs
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_runs_source_update
BEFORE UPDATE OF source ON ingestion_runs
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_checkpoints_source_insert
BEFORE INSERT ON ingestion_checkpoints
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_checkpoints_source_update
BEFORE UPDATE OF source ON ingestion_checkpoints
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_jobs_source_insert
BEFORE INSERT ON ingestion_jobs
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_jobs_source_update
BEFORE UPDATE OF source ON ingestion_jobs
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_jobs_status_insert
BEFORE INSERT ON ingestion_jobs
WHEN NEW.status NOT IN ('queued', 'processing', 'completed', 'skipped', 'failed', 'review')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion job status');
END;

CREATE TRIGGER ingestion_jobs_status_update
BEFORE UPDATE OF status ON ingestion_jobs
WHEN NEW.status NOT IN ('queued', 'processing', 'completed', 'skipped', 'failed', 'review')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion job status');
END;

CREATE TRIGGER ingestion_jobs_result_insert
BEFORE INSERT ON ingestion_jobs
WHEN NEW.result IS NOT NULL AND NEW.result NOT IN ('inserted', 'updated', 'skipped')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion job result');
END;

CREATE TRIGGER ingestion_jobs_result_update
BEFORE UPDATE OF result ON ingestion_jobs
WHEN NEW.result IS NOT NULL AND NEW.result NOT IN ('inserted', 'updated', 'skipped')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion job result');
END;

CREATE TRIGGER ingestion_discovery_state_source_insert
BEFORE INSERT ON ingestion_discovery_state
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER ingestion_discovery_state_source_update
BEFORE UPDATE OF source ON ingestion_discovery_state
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER review_records_source_insert
BEFORE INSERT ON review_records
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;

CREATE TRIGGER review_records_source_update
BEFORE UPDATE OF source ON review_records
WHEN NEW.source NOT IN ('met', 'smithsonian')
BEGIN
  SELECT RAISE(ABORT, 'invalid ingestion source');
END;
