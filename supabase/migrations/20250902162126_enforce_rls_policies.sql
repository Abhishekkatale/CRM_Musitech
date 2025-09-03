-- Helper function to get the role of the current user
create or replace function get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

-- Helper function to get the client_id for the current user
create or replace function get_my_client_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from clients where user_id = auth.uid();
$$;

-- USERS TABLE
drop policy if exists "Admins can see all users" on users;
create policy "Admins can see all users"
  on users for select
  to authenticated
  using (get_my_role() = 'admin');

drop policy if exists "Clients can see their own and sub-users records" on users;
create policy "Clients can see their own and sub-users records"
  on users for select
  to authenticated
  using (
    (get_my_role() = 'client' and id = auth.uid()) or
    (get_my_role() = 'client' and id in (select user_id from subusers where client_id = get_my_client_id()))
  );

drop policy if exists "Sub-users can see their own record" on users;
create policy "Sub-users can see their own record"
  on users for select
  to authenticated
  using (get_my_role() = 'subuser' and id = auth.uid());

drop policy if exists "Users can update their own record" on users;
create policy "Users can update their own record"
  on users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can update any user record" on users;
create policy "Admins can update any user record"
    on users for update
    to authenticated
    using (get_my_role() = 'admin')
    with check (get_my_role() = 'admin');

-- CLIENTS TABLE
drop policy if exists "Admins can see all clients" on clients;
create policy "Admins can see all clients"
  on clients for select
  to authenticated
  using (get_my_role() = 'admin');

drop policy if exists "Clients can see their own record" on clients;
create policy "Clients can see their own record"
  on clients for select
  to authenticated
  using (get_my_role() = 'client' and user_id = auth.uid());

drop policy if exists "Admins can insert clients" on clients;
create policy "Admins can insert clients"
    on clients for insert
    to authenticated
    with check (get_my_role() = 'admin');

-- SUBUSERS TABLE
drop policy if exists "Admins can see all subusers" on subusers;
create policy "Admins can see all subusers"
  on subusers for select
  to authenticated
  using (get_my_role() = 'admin');

drop policy if exists "Clients can see their own subusers" on subusers;
create policy "Clients can see their own subusers"
  on subusers for select
  to authenticated
  using (get_my_role() = 'client' and client_id = get_my_client_id());

drop policy if exists "Clients can insert their own subusers" on subusers;
create policy "Clients can insert their own subusers"
    on subusers for insert
    to authenticated
    with check (get_my_role() = 'client' and client_id = get_my_client_id());

-- AUDIT LOGS TABLE
drop policy if exists "Admins can see all audit logs" on audit_logs;
create policy "Admins can see all audit logs"
  on audit_logs for select
  to authenticated
  using (get_my_role() = 'admin');

drop policy if exists "Authenticated users can insert logs" on audit_logs;
create policy "Authenticated users can insert logs"
    on audit_logs for insert
    to authenticated
    with check (true);
