-- LA ESQUINA DEL SABOR — BASE DE DATOS DE PEDIDOS
-- Ejecuta TODO este archivo en Supabase > SQL Editor.
-- Luego crea el usuario administrador en Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null unique,
  tracking_token uuid not null unique default gen_random_uuid(),
  estado text not null default 'verificacion'
    check (estado in ('verificacion','validado','invalido','preparacion','camino','entregado')),
  motivo_invalido text,
  sucursal text not null,
  modalidad text not null,
  metodo_pago text,
  cliente jsonb not null,
  items jsonb not null,
  subtotal numeric(12,2) not null default 0,
  empaque numeric(12,2) not null default 0,
  domicilio numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists pedidos_estado_idx on public.pedidos(estado);
create index if not exists pedidos_creado_idx on public.pedidos(creado_en desc);
create index if not exists pedidos_tracking_idx on public.pedidos(tracking_token);

alter table public.pedidos enable row level security;

-- El cliente puede CREAR pedidos, pero no leerlos directamente.
drop policy if exists "anon puede crear pedidos" on public.pedidos;
create policy "anon puede crear pedidos"
on public.pedidos for insert
to anon, authenticated
with check (true);

-- Solo usuarios autenticados (panel) pueden leer y modificar pedidos.
drop policy if exists "admin autenticado puede ver pedidos" on public.pedidos;
create policy "admin autenticado puede ver pedidos"
on public.pedidos for select
to authenticated
using (true);

drop policy if exists "admin autenticado puede actualizar pedidos" on public.pedidos;
create policy "admin autenticado puede actualizar pedidos"
on public.pedidos for update
to authenticated
using (true)
with check (true);

-- Función pública de seguimiento: recibe únicamente el token privado
-- del enlace del cliente y devuelve datos limitados del pedido.
create or replace function public.consultar_pedido_por_token(p_token uuid)
returns table (
  numero_pedido text,
  estado text,
  motivo_invalido text,
  sucursal text,
  modalidad text,
  metodo_pago text,
  cliente jsonb,
  items jsonb,
  subtotal numeric,
  empaque numeric,
  domicilio numeric,
  total numeric,
  creado_en timestamptz,
  actualizado_en timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.numero_pedido, p.estado, p.motivo_invalido, p.sucursal, p.modalidad,
    p.metodo_pago, p.cliente, p.items, p.subtotal, p.empaque, p.domicilio,
    p.total, p.creado_en, p.actualizado_en
  from public.pedidos p
  where p.tracking_token = p_token
  limit 1;
$$;

revoke all on function public.consultar_pedido_por_token(uuid) from public;
grant execute on function public.consultar_pedido_por_token(uuid) to anon, authenticated;

-- Mantener actualizado actualizado_en.
create or replace function public.actualizar_pedido_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists pedidos_actualizado_en on public.pedidos;
create trigger pedidos_actualizado_en
before update on public.pedidos
for each row execute function public.actualizar_pedido_timestamp();
