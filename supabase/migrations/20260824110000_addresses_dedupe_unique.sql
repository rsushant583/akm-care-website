-- Address integrity: collapse exact duplicates per user, then unique index.
-- Different users may still share identical physical addresses.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        user_id,
        label,
        lower(trim(full_name)),
        regexp_replace(coalesce(phone, ''), '\D', '', 'g'),
        trim(pincode),
        lower(trim(state)),
        lower(trim(city)),
        lower(trim(area)),
        lower(trim(coalesce(landmark, '')))
      ORDER BY is_default DESC, created_at ASC, id ASC
    ) AS rn
  FROM public.addresses
)
DELETE FROM public.addresses a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS addresses_user_content_uidx
ON public.addresses (
  user_id,
  label,
  lower(trim(full_name)),
  regexp_replace(coalesce(phone, ''), '\D', '', 'g'),
  trim(pincode),
  lower(trim(state)),
  lower(trim(city)),
  lower(trim(area)),
  lower(trim(coalesce(landmark, '')))
);
