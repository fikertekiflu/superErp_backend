-- State keys must be unique per workflow, not globally.
-- Run once against your database (e.g. psql -f fix-workflow-state-key-unique.sql)

ALTER TABLE workflow_states
  DROP CONSTRAINT IF EXISTS "UQ_1d21c6c5ab81440667bc972a4d8";

DROP INDEX IF EXISTS "IDX_workflow_states_workflow_key";

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_workflow_states_workflow_key"
  ON workflow_states ("workflowId", "key");
