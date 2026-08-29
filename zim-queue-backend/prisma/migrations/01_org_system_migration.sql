-- =============================================================================
-- SMART QUEUE PLATFORM: ORGANIZATION SIGNUP, VERIFICATION, & RLS MIGRATION
-- =============================================================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLES CREATION
-- -----------------------------------------------------------------------------

-- ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'id_office', 'passport_office', 'other')),
  registration_number VARCHAR(100) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID
);

-- ORG MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_org_user UNIQUE (org_id, user_id)
);

-- ORG INVITES TABLE
CREATE TABLE IF NOT EXISTS public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXTEND BRANCHES TABLE TO LINK WITH ORGANIZATIONS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'branches' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.branches ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. HELPER SECURITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Helper: Check if current authenticated user is a platform super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin check via user metadata or custom role table check
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'is_super_admin')::boolean,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is owner/admin of a specific org
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id 
      AND user_id = p_user_id 
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT
  USING (
    public.is_super_admin() OR
    id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_insert_policy" ON public.organizations;
CREATE POLICY "org_insert_policy" ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "org_update_details_policy" ON public.organizations;
CREATE POLICY "org_update_details_policy" ON public.organizations
  FOR UPDATE
  USING (
    public.is_super_admin() OR
    public.is_org_admin(id, auth.uid())
  );

-- ORG MEMBERS POLICIES
DROP POLICY IF EXISTS "members_select_policy" ON public.org_members;
CREATE POLICY "members_select_policy" ON public.org_members
  FOR SELECT
  USING (
    public.is_super_admin() OR
    user_id = auth.uid() OR
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "members_write_policy" ON public.org_members;
CREATE POLICY "members_write_policy" ON public.org_members
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.is_org_admin(org_id, auth.uid())
  );

-- ORG INVITES POLICIES
DROP POLICY IF EXISTS "invites_manage_policy" ON public.org_invites;
CREATE POLICY "invites_manage_policy" ON public.org_invites
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.is_org_admin(org_id, auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONAL RPC PROCEDURES
-- -----------------------------------------------------------------------------

-- Transactional RPC: Create Organization with Owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  p_name VARCHAR,
  p_type VARCHAR,
  p_reg_num VARCHAR,
  p_contact_email VARCHAR,
  p_contact_phone VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to register an organization.';
  END IF;

  -- Insert Organization (Status: pending)
  INSERT INTO public.organizations (
    name, type, registration_number, contact_email, contact_phone, status
  ) VALUES (
    p_name, p_type, p_reg_num, p_contact_email, p_contact_phone, 'pending'
  ) RETURNING id INTO v_org_id;

  -- Insert Signer as Owner
  INSERT INTO public.org_members (
    org_id, user_id, role
  ) VALUES (
    v_org_id, v_user_id, 'owner'
  );

  v_result := jsonb_build_object(
    'org_id', v_org_id,
    'status', 'pending',
    'message', 'Organization registered successfully and is pending review.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transactional RPC: Accept Staff Invite Token
CREATE OR REPLACE FUNCTION public.accept_org_invite(p_token VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_invite public.org_invites%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept invitation.';
  END IF;

  -- Select and validate invite token
  SELECT * INTO v_invite
  FROM public.org_invites
  WHERE token = p_token AND expires_at > NOW();

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token.';
  END IF;

  -- Insert user into org_members
  INSERT INTO public.org_members (
    org_id, user_id, role, invited_by
  ) VALUES (
    v_invite.org_id, v_user_id, v_invite.role, v_invite.created_by
  )
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Delete consumed invite token
  DELETE FROM public.org_invites WHERE id = v_invite.id;

  v_result := jsonb_build_object(
    'org_id', v_invite.org_id,
    'role', v_invite.role,
    'message', 'Successfully joined organization.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
