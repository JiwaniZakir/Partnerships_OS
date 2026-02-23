-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Add vector column to contacts table (after Prisma creates it)
-- This runs as a post-migration step since Prisma doesn't support vector natively
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'profile_embedding'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_embedding vector(1536);
  END IF;
END $$;

-- Create HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS contacts_embedding_idx
  ON contacts USING hnsw (profile_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create GIN trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS contacts_fullname_trgm_idx
  ON contacts USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS contacts_organization_trgm_idx
  ON contacts USING gin (organization gin_trgm_ops);
