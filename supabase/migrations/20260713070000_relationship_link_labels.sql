alter table public.relationship_links
  add column if not exists user_a_label text,
  add column if not exists user_b_label text;
