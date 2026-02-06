-- NULO AFRICA - ROW LEVEL SECURITY (RLS) POLICIES
-- Run this after creating the schema

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Admins can view all users (system level access)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Users can view own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles are viewable (for landlord info on properties)
CREATE POLICY "Public profiles viewable" ON users
  FOR SELECT USING (true);

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Tenants view own data
CREATE POLICY "Tenants view own data" ON tenants
  FOR SELECT USING (auth.uid() = id);

-- Tenants update own data
CREATE POLICY "Tenants update own data" ON tenants
  FOR UPDATE USING (auth.uid() = id);

-- Tenants insert own data (on signup)
CREATE POLICY "Tenants insert own data" ON tenants
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Landlords can view tenant data for their applications
CREATE POLICY "Landlords view applicant data" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.tenant_id = tenants.id
        AND p.landlord_id = auth.uid()
    )
  );

-- ============================================================================
-- LANDLORDS TABLE POLICIES
-- ============================================================================

-- Landlords view own data
CREATE POLICY "Landlords view own data" ON landlords
  FOR SELECT USING (auth.uid() = id);

-- Landlords update own data
CREATE POLICY "Landlords update own data" ON landlords
  FOR UPDATE USING (auth.uid() = id);

-- Landlords insert own data (on signup)
CREATE POLICY "Landlords insert own data" ON landlords
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ADMINS TABLE POLICIES
-- ============================================================================

-- Admins view own data
CREATE POLICY "Admins view own data" ON admins
  FOR SELECT USING (auth.uid() = id);

-- Admins update own data
CREATE POLICY "Admins update own data" ON admins
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- PROPERTIES TABLE POLICIES
-- ============================================================================

-- Public can view active properties
CREATE POLICY "Public can view active properties" ON properties
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

-- Landlords view own properties (all statuses)
CREATE POLICY "Landlords view own properties" ON properties
  FOR SELECT USING (auth.uid() = landlord_id);

-- Landlords insert properties
CREATE POLICY "Landlords insert properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- Landlords update own properties
CREATE POLICY "Landlords update own properties" ON properties
  FOR UPDATE USING (auth.uid() = landlord_id);

-- Landlords delete own properties
CREATE POLICY "Landlords delete own properties" ON properties
  FOR DELETE USING (auth.uid() = landlord_id);

-- Admins can view all properties
CREATE POLICY "Admins view all properties" ON properties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Admins can update properties (for verification)
CREATE POLICY "Admins update properties" ON properties
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- ============================================================================
-- APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Tenants view own applications
CREATE POLICY "Tenants view own applications" ON applications
  FOR SELECT USING (auth.uid() = tenant_id);

-- Landlords view applications for their properties
CREATE POLICY "Landlords view property applications" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT landlord_id FROM properties WHERE id = applications.property_id
    )
  );

-- Tenants create applications
CREATE POLICY "Tenants create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Tenants update own applications (withdraw)
CREATE POLICY "Tenants update own applications" ON applications
  FOR UPDATE USING (auth.uid() = tenant_id);

-- Landlords update applications for their properties
CREATE POLICY "Landlords update applications" ON applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT landlord_id FROM properties WHERE id = applications.property_id
    )
  );

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

-- Users view messages they sent or received
CREATE POLICY "Users view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users send messages
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users update own messages (mark as read)
CREATE POLICY "Users update messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Tenants view own transactions
CREATE POLICY "Tenants view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = tenant_id);

-- Landlords view transactions for their properties
CREATE POLICY "Landlords view transactions" ON transactions
  FOR SELECT USING (auth.uid() = landlord_id);

-- System can create transactions (via service role)
-- No INSERT policy for regular users

-- ============================================================================
-- RATINGS TABLE POLICIES
-- ============================================================================

-- Users can view ratings they gave
CREATE POLICY "Users view ratings they gave" ON ratings
  FOR SELECT USING (auth.uid() = rater_id);

-- Users can view ratings they received
CREATE POLICY "Users view ratings received" ON ratings
  FOR SELECT USING (auth.uid() = rated_id);

-- Public can view all ratings (for trust scores)
CREATE POLICY "Public view ratings" ON ratings
  FOR SELECT USING (true);

-- Users can create ratings
CREATE POLICY "Users create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ============================================================================
-- GUARANTEE_FUND TABLE POLICIES
-- ============================================================================

-- Landlords view own contributions
CREATE POLICY "Landlords view own contributions" ON guarantee_fund
  FOR SELECT USING (auth.uid() = landlord_id);

-- Landlords can view fund summary (via view)
-- View is public for transparency

-- ============================================================================
-- FAVORITES TABLE POLICIES
-- ============================================================================

-- Tenants view own favorites
CREATE POLICY "Tenants view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = tenant_id);

-- Tenants add favorites
CREATE POLICY "Tenants add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Tenants remove favorites
CREATE POLICY "Tenants remove favorites" ON favorites
  FOR DELETE USING (auth.uid() = tenant_id);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users view own notifications
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users update own notifications (mark as read)
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System creates notifications (via service role)
-- No INSERT policy for regular users

-- ============================================================================
-- COMPLETED: RLS Policies
-- ============================================================================
