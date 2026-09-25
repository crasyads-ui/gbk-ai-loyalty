create extension if not exists pgcrypto;

create table if not exists public.loyalty_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role text not null check (role in ('customer','merchant','founder')),
  founder_type text check (founder_type in ('country','global')),
  full_name text, email text, phone text, country text, wallet_address text,
  status text not null default 'pending' check (status in ('pending','active','paused','suspended')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.loyalty_profiles(id) on delete cascade,
  business_name text not null, category text, city text, country text,
  loyalty_offer_bps integer not null default 500 check (loyalty_offer_bps between 500 and 2000),
  founder_profile_id uuid references public.loyalty_profiles(id),
  gbk_balance_raw numeric(78,0) not null default 0, gbk_allowance_raw numeric(78,0) not null default 0,
  min_active_balance_percent integer not null default 50 check (min_active_balance_percent between 1 and 100),
  loyalty_status text not null default 'pending' check (loyalty_status in ('pending','active','paused','suspended')),
  payment_provider text, payment_account_ref text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.merchants(id),
  customer_profile_id uuid references public.loyalty_profiles(id), external_payment_id text,
  amount_minor numeric(30,0) not null, currency text not null,
  status text not null default 'pending' check (status in ('pending','paid','refunded','cancelled','rewarded')),
  idempotency_key text unique, paid_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  merchant_id uuid not null references public.merchants(id), recipient_profile_id uuid references public.loyalty_profiles(id),
  recipient_type text not null check (recipient_type in ('customer','founder','platform')),
  allocation_bps integer not null check (allocation_bps >= 0), reward_amount_raw numeric(78,0) not null,
  status text not null default 'pending' check (status in ('pending','completed','reversed','failed')), tx_hash text,
  created_at timestamptz not null default now(), unique(order_id, recipient_type)
);
alter table public.loyalty_profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.orders enable row level security;
alter table public.reward_ledger enable row level security;