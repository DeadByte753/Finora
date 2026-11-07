-- Creates a profile for anyone who signed up before the profiles trigger existed.
insert into public.profiles (user_id, full_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id);
