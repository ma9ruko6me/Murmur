ALTER TABLE comments ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX idx_comments_post_id_created_at ON comments (post_id, created_at);
