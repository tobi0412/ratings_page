-- Create the bucket for pictures
insert into storage.buckets (id, name, public)
values ('pictures', 'pictures', true);

-- Policy to allow public access to pictures bucket
create policy "Public Access"
  on storage.objects for select
  to anon, authenticated
  using ( bucket_id = 'pictures' );

-- Policy to allow authenticated users to upload files
create policy "Authenticated Uploads"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'pictures' );
