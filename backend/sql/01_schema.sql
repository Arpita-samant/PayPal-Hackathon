-- ==============================================================================
-- 01_schema.sql: Supabase Schema with pgvector for FairShare Global Prize Splitter
-- ==============================================================================

-- Enable pgvector extension for commit embeddings and semantic code search
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    github_username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    country TEXT DEFAULT 'US',
    paypal_email TEXT,
    upi_id TEXT,
    bank_iban TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams / Hackathon Projects Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_name TEXT NOT NULL DEFAULT 'Team Leader',
    leader_email TEXT,
    repo_url TEXT NOT NULL,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    timeframe_start TIMESTAMPTZ,
    timeframe_end TIMESTAMPTZ,
    total_prize_amount NUMERIC(12, 2) DEFAULT 1000.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL, -- USD, INR, EUR, GBP, CAD, AUD, SGD, etc.
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'members_setup', 'auditing', 'review', 'disputed', 'approved', 'payment_setup', 'paid')) NOT NULL,
    payment_provider TEXT DEFAULT 'paypal' CHECK (payment_provider IN ('paypal', 'upi_razorpay', 'stripe_transfer', 'wise')) NOT NULL,
    provider_authorized BOOLEAN DEFAULT FALSE,
    estimated_fees NUMERIC(10, 2) DEFAULT 0.00,
    final_total NUMERIC(12, 2) DEFAULT 1000.00,
    distribution_history JSONB DEFAULT '[]'::jsonb,
    approval_history JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Members Table (Contributors & Recipients)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Contributor',
    email TEXT,
    github_username TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'Core Contributor' NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    is_eligible BOOLEAN DEFAULT TRUE, -- Leader toggle: whether member participates in prize
    country TEXT DEFAULT 'US',
    payment_account_type TEXT DEFAULT 'paypal_email', -- paypal_email | upi_id | iban | wise_email
    payment_account_value TEXT,
    account_verified BOOLEAN DEFAULT FALSE,
    ai_contribution_pct NUMERIC(6, 2) DEFAULT 0.00 NOT NULL,
    manual_percentage NUMERIC(6, 2) DEFAULT 0.00 NOT NULL,
    manual_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    final_percentage NUMERIC(6, 2) DEFAULT 0.00 NOT NULL,
    payout_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'flagged')) NOT NULL,
    flag_reason TEXT,
    approval_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, github_username)
);

-- 4. Commit Audits Table (Metadata & 768-dim embeddings)
CREATE TABLE IF NOT EXISTS public.commit_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    commit_hash TEXT NOT NULL,
    author_username TEXT NOT NULL,
    message TEXT,
    committed_at TIMESTAMPTZ NOT NULL,
    additions INTEGER DEFAULT 0 NOT NULL,
    deletions INTEGER DEFAULT 0 NOT NULL,
    files_changed INTEGER DEFAULT 0 NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('frontend', 'backend', 'architecture', 'devops', 'docs', 'boilerplate')) NOT NULL,
    complexity_score NUMERIC(5, 2) DEFAULT 1.0 NOT NULL,
    impact_summary TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, commit_hash)
);

-- 5. Fairness Reports Table
CREATE TABLE IF NOT EXISTS public.fairness_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
    executive_summary TEXT,
    formula_weights JSONB DEFAULT '{"complexity": 0.40, "impact": 0.30, "pr_review": 0.15, "loc_volume": 0.15}'::jsonb NOT NULL,
    breakdown_data JSONB NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payout Receipts Table (Permanent, immutable financial ledger)
CREATE TABLE IF NOT EXISTS public.payout_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    batch_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    payout_status TEXT NOT NULL, -- SUCCESS, PENDING, PARTIAL_FAILED, FAILED
    total_payout_amount NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD' NOT NULL,
    disbursement_details JSONB NOT NULL, -- Array of recipient items with individual status
    raw_provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for semantic similarity vector search
CREATE INDEX IF NOT EXISTS commit_audits_embedding_idx 
ON public.commit_audits 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
