PRAGMA foreign_keys = ON;

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  alternative_names TEXT NOT NULL DEFAULT '[]', description TEXT, artifact_type TEXT, origin TEXT,
  historical_period TEXT, earliest_year INTEGER, latest_year INTEGER, date_display TEXT,
  date_uncertain INTEGER NOT NULL DEFAULT 0, materials TEXT NOT NULL DEFAULT '[]', dimensions TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','review','published','restricted')),
  quality_score REAL NOT NULL DEFAULT 0, search_cultures TEXT NOT NULL DEFAULT '', search_civilizations TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CONSTRAINT artifacts_year_order CHECK (earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year)
);
CREATE UNIQUE INDEX artifacts_slug_uq ON artifacts(slug);
CREATE INDEX artifacts_status_idx ON artifacts(publication_status);
CREATE INDEX artifacts_period_idx ON artifacts(earliest_year, latest_year);

CREATE TABLE artifact_sources (
  id TEXT PRIMARY KEY NOT NULL, artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  institution TEXT NOT NULL, external_id TEXT NOT NULL, source_url TEXT NOT NULL, accession_number TEXT,
  raw_metadata TEXT, raw_metadata_key TEXT, last_fetched_at INTEGER NOT NULL, attribution TEXT, metadata_license TEXT,
  record_hash TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX artifact_sources_identity_uq ON artifact_sources(institution, external_id);
CREATE INDEX artifact_sources_artifact_idx ON artifact_sources(artifact_id);
CREATE INDEX artifact_sources_hash_idx ON artifact_sources(record_hash);

CREATE TABLE artifact_images (
  id TEXT PRIMARY KEY NOT NULL, artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES artifact_sources(id) ON DELETE CASCADE, original_url TEXT NOT NULL,
  width INTEGER, height INTEGER, mime_type TEXT, dominant_color TEXT, content_hash TEXT, original_object_key TEXT,
  license_identifier TEXT, license_url TEXT, attribution TEXT, redistribution_allowed INTEGER NOT NULL DEFAULT 0,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','review','published','restricted')),
  processed_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX artifact_images_source_url_uq ON artifact_images(source_id, original_url);
CREATE INDEX artifact_images_hash_idx ON artifact_images(content_hash);
CREATE INDEX artifact_images_artifact_idx ON artifact_images(artifact_id);

CREATE TABLE image_variants (
  id TEXT PRIMARY KEY NOT NULL, image_id TEXT NOT NULL REFERENCES artifact_images(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('thumbnail','medium','large')), width INTEGER NOT NULL, height INTEGER NOT NULL,
  byte_size INTEGER NOT NULL, mime_type TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(image_id, name)
);

CREATE TABLE cultures (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE civilizations (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE artifact_cultures (artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE, culture_id TEXT NOT NULL REFERENCES cultures(id) ON DELETE RESTRICT, PRIMARY KEY(artifact_id, culture_id));
CREATE TABLE artifact_civilizations (artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE, civilization_id TEXT NOT NULL REFERENCES civilizations(id) ON DELETE RESTRICT, PRIMARY KEY(artifact_id, civilization_id));

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('running','completed','failed','cancelled')),
  started_at INTEGER NOT NULL, ended_at INTEGER, discovered INTEGER NOT NULL DEFAULT 0, processed INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL DEFAULT 0, skipped INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0, images_processed INTEGER NOT NULL DEFAULT 0, errors INTEGER NOT NULL DEFAULT 0,
  report TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE ingestion_checkpoints (
  id TEXT PRIMARY KEY NOT NULL, run_id TEXT NOT NULL REFERENCES ingestion_runs(id) ON DELETE CASCADE, source TEXT NOT NULL,
  cursor TEXT, state TEXT NOT NULL, processed_external_id TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), UNIQUE(run_id, source)
);
CREATE TABLE review_records (
  id TEXT PRIMARY KEY NOT NULL, run_id TEXT REFERENCES ingestion_runs(id) ON DELETE SET NULL, source TEXT NOT NULL,
  external_id TEXT, artifact_id TEXT REFERENCES artifacts(id) ON DELETE SET NULL, reason_code TEXT NOT NULL, reason TEXT NOT NULL,
  payload TEXT, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX review_records_status_idx ON review_records(status);

CREATE VIRTUAL TABLE artifacts_fts USING fts5(
  title, alternative_names, description, search_cultures, search_civilizations, origin, historical_period,
  content='artifacts', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER artifacts_fts_insert AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid,title,alternative_names,description,search_cultures,search_civilizations,origin,historical_period)
  VALUES(new.rowid,new.title,new.alternative_names,new.description,new.search_cultures,new.search_civilizations,new.origin,new.historical_period);
END;
CREATE TRIGGER artifacts_fts_delete AFTER DELETE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts,rowid,title,alternative_names,description,search_cultures,search_civilizations,origin,historical_period)
  VALUES('delete',old.rowid,old.title,old.alternative_names,old.description,old.search_cultures,old.search_civilizations,old.origin,old.historical_period);
END;
CREATE TRIGGER artifacts_fts_update AFTER UPDATE ON artifacts BEGIN
  INSERT INTO artifacts_fts(artifacts_fts,rowid,title,alternative_names,description,search_cultures,search_civilizations,origin,historical_period)
  VALUES('delete',old.rowid,old.title,old.alternative_names,old.description,old.search_cultures,old.search_civilizations,old.origin,old.historical_period);
  INSERT INTO artifacts_fts(rowid,title,alternative_names,description,search_cultures,search_civilizations,origin,historical_period)
  VALUES(new.rowid,new.title,new.alternative_names,new.description,new.search_cultures,new.search_civilizations,new.origin,new.historical_period);
END;
INSERT INTO artifacts_fts(artifacts_fts) VALUES('rebuild');
