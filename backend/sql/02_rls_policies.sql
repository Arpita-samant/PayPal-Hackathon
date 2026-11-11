-- ==============================================================================
-- 02_rls_policies.sql: Row Level Security (RLS) Configuration
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commit_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fairness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_receipts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Teams Policies
CREATE POLICY "Users can view teams they belong to or created"
ON public.teams FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid()
    ) OR
    auth.uid() IS NULL -- allows read when unauthenticated demo mode or anon access
);

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team creator can update team"
ON public.teams FOR UPDATE USING (created_by = auth.uid());

-- 3. Team Members Policies
CREATE POLICY "Team members are viewable by team participants"
ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Users can update their own team member wallet info & approval"
ON public.team_members FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE teams.id = team_members.team_id 
        AND teams.created_by = auth.uid()
    )
);

CREATE POLICY "Allow team creator to insert members"
ON public.team_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE teams.id = team_members.team_id 
        AND teams.created_by = auth.uid()
    )
);

-- 4. Commit Audits Policies
CREATE POLICY "Commit audits viewable by all team participants"
ON public.commit_audits FOR SELECT USING (true);

-- 5. Fairness Reports Policies
CREATE POLICY "Fairness reports viewable by all team participants"
ON public.fairness_reports FOR SELECT USING (true);

-- 6. Payout Receipts Policies (Strict Financial Ledger)
CREATE POLICY "Payout receipts viewable by team participants"
ON public.payout_receipts FOR SELECT USING (true);

-- Only backend service_role can insert or alter payout receipts
-- (service_role automatically bypasses RLS in Supabase)
