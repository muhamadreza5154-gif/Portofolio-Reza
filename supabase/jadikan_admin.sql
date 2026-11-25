-- =====================================================================
--  JADIKAN AKUN KAMU SEBAGAI ADMIN
-- ---------------------------------------------------------------------
--  SEBELUM menjalankan file ini:
--  1. Supabase Dashboard -> menu "Authentication" -> "Users"
--  2. Klik "Add user" -> "Create new user"
--  3. Isi email & password (CENTANG "Auto Confirm User") -> "Create user"
--
--  LALU:
--  4. Ganti EMAIL_KAMU@gmail.com di bawah dengan email tadi
--  5. Paste ke SQL Editor -> klik "Run"
-- =====================================================================

insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email = 'muhamadreza5154@gmail.com'
on conflict (id) do update set role = 'admin';

-- Cek hasilnya (harus muncul 1 baris dengan role = admin):
select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id;
