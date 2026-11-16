ALTER TABLE artifact_publication_events RENAME TO artifact_publication_events_old;

CREATE TABLE artifact_publication_events (
  id TEXT PRIMARY KEY NOT NULL,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  moderator_id TEXT REFERENCES `user`(id) ON DELETE RESTRICT,
  actor_type TEXT NOT NULL DEFAULT 'moderator' CHECK (actor_type IN ('moderator', 'automation')),
  action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish')),
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK (
    (actor_type = 'moderator' AND moderator_id IS NOT NULL) OR
    (actor_type = 'automation' AND moderator_id IS NULL)
  )
);

INSERT INTO artifact_publication_events
  (id, artifact_id, moderator_id, actor_type, action, note, created_at)
SELECT id, artifact_id, moderator_id, 'moderator', action, note, created_at
FROM artifact_publication_events_old;

DROP TABLE artifact_publication_events_old;

CREATE INDEX artifact_publication_events_artifact_idx
  ON artifact_publication_events(artifact_id, created_at);
