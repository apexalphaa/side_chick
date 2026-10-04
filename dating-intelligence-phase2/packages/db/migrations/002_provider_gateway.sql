ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS weight INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS monthly_spend_cap_usd NUMERIC(12,4) NOT NULL DEFAULT 0;

ALTER TABLE provider_quota_telemetry
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'provider',
  ADD COLUMN IF NOT EXISTS status_code INT;

CREATE TABLE IF NOT EXISTS provider_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  request_count BIGINT NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, month_start)
);

CREATE TABLE IF NOT EXISTS provider_health (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'CLOSED'
    CHECK (state IN ('CLOSED','OPEN','HALF_OPEN')),
  consecutive_failures INT NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  latency_ms INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
