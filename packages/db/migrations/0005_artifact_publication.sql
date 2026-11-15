ALTER TABLE `user` ADD COLUMN `role` text NOT NULL DEFAULT 'member'
  CHECK (`role` IN ('member', 'moderator'));

CREATE TABLE artifact_publication_events (
  id TEXT PRIMARY KEY NOT NULL,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  moderator_id TEXT NOT NULL REFERENCES `user`(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish')),
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX artifact_publication_events_artifact_idx
  ON artifact_publication_events(artifact_id, created_at);

-- After an account is created and verified, grant moderator access with:
-- UPDATE `user` SET role = 'moderator' WHERE email = 'moderator@example.org';
