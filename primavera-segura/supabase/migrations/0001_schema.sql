-- Primavera Segura · schema, RLS and RPC functions
-- Security notes (Stage 2 Cybersecurity): default deny, roles are read from profiles on the
-- server (never from the client), no patient data columns exist (C05, C02, C08).

create extension if not exists postgis;

create type public.app_role as enum ('rescatista', 'coordinador', 'administrador');
create type public.severity as enum ('baja', 'media', 'alta');
create type public.incident_status as enum ('pendiente', 'validado', 'cerrado');
create type public.location_precision as enum ('exacta', 'sendero', 'kilometro');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'rescatista',
  brigade text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.incident_types (
  code text primary key,
  label text not null
);

insert into public.incident_types (code, label) values
  ('caida', 'Caída'), ('fractura', 'Fractura'), ('desorientacion', 'Desorientación'),
  ('deshidratacion', 'Deshidratación'), ('picadura', 'Picadura o mordedura'),
  ('humo', 'Avistamiento de humo'), ('otro', 'Otro');

create table public.trails (
  id serial primary key,
  name text not null unique,
  geom geography(linestring, 4326)
);

create table public.map_layers (
  id serial primary key,
  kind text not null check (kind in ('acceso', 'cuerpo_agua', 'uso_publico', 'sendero')),
  name text not null,
  geom geography(geometry, 4326) not null
);

create table public.forest_boundary (
  id int primary key default 1 check (id = 1),
  geom geography(polygon, 4326) not null
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  type_code text not null references public.incident_types (code),
  severity public.severity not null,
  occurred_on date not null check (occurred_on <= current_date),
  location geography(point, 4326) not null,
  location_precision public.location_precision not null default 'exacta',
  trail text,
  status public.incident_status not null default 'pendiente',
  source text not null default 'app' check (source in ('app', 'historico', 'sintetico')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index incidents_location_idx on public.incidents using gist (location);
create index incidents_date_idx on public.incidents (occurred_on);

-- Audit log: actor, action, result, time. Never stores the incident payload (C09).
create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  result text not null,
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function public.current_role_name() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.write_audit(p_action text, p_result text) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, result) values (auth.uid(), p_action, p_result)
$$;

-- ---------- row level security (default deny) ----------
alter table public.profiles enable row level security;
alter table public.incident_types enable row level security;
alter table public.trails enable row level security;
alter table public.map_layers enable row level security;
alter table public.forest_boundary enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid());
create policy profiles_admin_read on public.profiles for select using (public.current_role_name() = 'administrador');
create policy profiles_admin_write on public.profiles for update
  using (public.current_role_name() = 'administrador') with check (public.current_role_name() = 'administrador');

create policy ref_read_types on public.incident_types for select using (public.current_role_name() is not null);
create policy ref_read_trails on public.trails for select using (public.current_role_name() is not null);
create policy ref_read_layers on public.map_layers for select using (public.current_role_name() is not null);
create policy ref_read_boundary on public.forest_boundary for select using (public.current_role_name() is not null);

create policy incidents_read on public.incidents for select using (public.current_role_name() is not null);
-- No insert/update/delete policies on incidents: writes only go through the RPC functions below.
create policy audit_admin_read on public.audit_log for select using (public.current_role_name() = 'administrador');

-- ---------- RPC: create_incident (PB-11, C05) ----------
create or replace function public.create_incident(
  p_type text, p_severity text, p_occurred_on date, p_lat double precision, p_lon double precision,
  p_trail text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_role public.app_role := public.current_role_name();
  v_point geography := st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography;
  v_id uuid;
begin
  if v_role is null then
    perform public.write_audit('create_incident', 'denied');
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.incident_types where code = p_type) then
    raise exception 'invalid type' using errcode = '22023';
  end if;
  if p_severity not in ('baja', 'media', 'alta') then
    raise exception 'invalid severity' using errcode = '22023';
  end if;
  if p_occurred_on is null or p_occurred_on > current_date then
    raise exception 'invalid date' using errcode = '22023';
  end if;
  if p_lat is null or p_lon is null
     or not exists (select 1 from public.forest_boundary where st_covers(geom, v_point)) then
    raise exception 'location outside forest' using errcode = '22023';
  end if;

  insert into public.incidents (type_code, severity, occurred_on, location, trail, created_by)
  values (p_type, p_severity::public.severity, p_occurred_on, v_point, p_trail, auth.uid())
  returning id into v_id;
  perform public.write_audit('create_incident', 'ok');
  return v_id;
end $$;

-- ---------- RPC: read functions ----------
create or replace function public.get_incidents(
  p_from date default null, p_to date default null, p_type text default null,
  p_severity text default null, p_trail text default null
) returns table (id uuid, type_code text, severity public.severity, occurred_on date,
                 latitude double precision, longitude double precision,
                 location_precision public.location_precision, trail text,
                 status public.incident_status, source text)
language sql stable security invoker set search_path = public as $$
  select i.id, i.type_code, i.severity, i.occurred_on, st_y(i.location::geometry), st_x(i.location::geometry),
         i.location_precision, i.trail, i.status, i.source
  from public.incidents i
  where (p_from is null or i.occurred_on >= p_from) and (p_to is null or i.occurred_on <= p_to)
    and (p_type is null or i.type_code = p_type) and (p_severity is null or i.severity::text = p_severity)
    and (p_trail is null or i.trail = p_trail)
  order by i.occurred_on desc
$$;

-- Critical zones: ~500 m square grid, score = sum(weight), critical when score >= p80 and n >= 5.
create or replace function public.get_critical_zones(p_from date default null, p_to date default null)
returns table (cell_lat double precision, cell_lon double precision, n bigint, score bigint,
               critical boolean, low_confidence boolean)
language sql stable security invoker set search_path = public as $$
  with cells as (
    select floor(st_y(location::geometry) / 0.0045) as r, floor(st_x(location::geometry) / 0.0048) as c,
           count(*) as n,
           sum(case severity when 'baja' then 1 when 'media' then 2 else 3 end) as score
    from public.incidents
    where (p_from is null or occurred_on >= p_from) and (p_to is null or occurred_on <= p_to)
    group by 1, 2
  ), threshold as (select coalesce(percentile_disc(0.8) within group (order by score), 'Infinity'::float8) as p80 from cells)
  select (r + 0.5) * 0.0045, (c + 0.5) * 0.0048, n, score,
         (score >= (select p80 from threshold) and n >= 5), (n < 5)
  from cells order by score desc
$$;

create or replace function public.compare_periods(a_from date, a_to date, b_from date, b_to date)
returns table (cell_lat double precision, cell_lon double precision, score_a bigint, score_b bigint,
               delta bigint, low_confidence boolean)
language sql stable security invoker set search_path = public as $$
  with s as (
    select floor(st_y(location::geometry) / 0.0045) as r, floor(st_x(location::geometry) / 0.0048) as c,
           sum(case severity when 'baja' then 1 when 'media' then 2 else 3 end)
             filter (where occurred_on between a_from and a_to) as sa,
           sum(case severity when 'baja' then 1 when 'media' then 2 else 3 end)
             filter (where occurred_on between b_from and b_to) as sb,
           count(*) filter (where occurred_on between a_from and a_to or occurred_on between b_from and b_to) as n
    from public.incidents group by 1, 2
  )
  select (r + 0.5) * 0.0045, (c + 0.5) * 0.0048, coalesce(sa, 0), coalesce(sb, 0),
         coalesce(sb, 0) - coalesce(sa, 0), n < 5
  from s where coalesce(sa, 0) <> 0 or coalesce(sb, 0) <> 0 order by abs(coalesce(sb, 0) - coalesce(sa, 0)) desc
$$;

-- ---------- RPC: coordinator / admin actions ----------
create or replace function public.set_incident_status(p_id uuid, p_status public.incident_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() not in ('coordinador', 'administrador') then
    perform public.write_audit('set_incident_status', 'denied');
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.incidents set status = p_status where id = p_id;
  perform public.write_audit('set_incident_status', 'ok');
end $$;

create or replace function public.set_user_role(p_user uuid, p_role public.app_role, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() is distinct from 'administrador' then
    perform public.write_audit('set_user_role', 'denied');
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set role = p_role, is_active = p_active where id = p_user;
  perform public.write_audit('set_user_role', 'ok');
end $$;

-- New auth users get the least-privileged role; an administrator promotes them.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke all on all functions in schema public from public, anon;
grant execute on function public.create_incident, public.get_incidents, public.get_critical_zones,
  public.compare_periods, public.set_incident_status, public.set_user_role to authenticated;
