-- Seed catalog from Excel master (Pd Data.xlsx) + local catalog image paths.
-- Run AFTER 20260724045557_catalog_normalized_backend.sql
-- Image URLs initially point at site /catalog/... ; import script can rewrite to Storage URLs.

insert into brands (id, name, slug, description)
values (
  'a0000000-0000-4000-8000-000000000001',
  'AKM Care',
  'akm-care',
  'Trusted & Fair — apparel, clothing & imitation jewelry'
)
on conflict (slug) do update set name = excluded.name, description = excluded.description, updated_at = now();

insert into categories (id, name, slug, description, display_order)
values
  ('b0000000-0000-4000-8000-000000000001', 'Sarees', 'sarees', 'Ethnic sarees & textiles', 1),
  ('b0000000-0000-4000-8000-000000000002', 'Apparel', 'apparel', 'Apparel & clothing', 2),
  ('b0000000-0000-4000-8000-000000000003', 'Imitation Jewelry', 'imitation-jewelry', 'Fashion jewelry', 3),
  ('b0000000-0000-4000-8000-000000000004', 'Food', 'food', 'Village & organic food', 4)
on conflict (slug) do update set name = excluded.name, description = excluded.description, updated_at = now();

insert into subcategories (id, category_id, name, slug, display_order)
values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Chanderi Print', 'chanderi-print', 1)
on conflict (category_id, slug) do update set name = excluded.name;

-- Upsert SANI
insert into products (
  id, name, slug, sku, product_code, brand_id, category_id, subcategory_id,
  short_description, detailed_description, description,
  mrp, selling_price, akm_care_price, price, discount_percent,
  gst_percent, gst_number, hsn, dimensions, weight,
  stock_quantity, status, shipping_time, warranty, packing_type, freight_cost,
  category, category_label, tags,
  is_featured, is_new_arrival, is_best_seller, is_trending, popularity, display_order,
  image_url, seo_title, seo_description, specifications
) values (
  'd0000000-0000-4000-8000-000000000001',
  'AKMC SANI - 1007',
  'akmc-sani-1007',
  'AKMCC90',
  'AKMCC90',
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'Chanderi Print Saree with unstitched Blouse',
  'Premium Chanderi print saree (approx. 6.2 metres) with unstitched blouse piece. Elegant floral vine work, finished border, and festive-ready drape. Sourced for AKM Care — Trusted & Fair apparel.',
  'Chanderi Print Saree with unstitched Blouse',
  546, 546, 468, 468, 14,
  5, '24AIFPB2688G1ZG', '540752', '6.2 Mtrs APX', null,
  8, 'available', 'within 24 Hours', 'NA — within 7 days return policy', 'Polythene Packing', null,
  'sarees', 'Sarees', '["Chanderi","Ethnic Wear","Apparel","Print","Women","AKM Care"]'::jsonb,
  true, true, true, true, 98, 1,
  '/catalog/akmc-sani-1007/01.png',
  'AKMC SANI - 1007 | Chanderi Print Saree | AKM Care',
  'Buy AKMC SANI - 1007 Chanderi print saree with unstitched blouse. AKM Care price ₹468.',
  '{"variant":"PRINT","packing":"Polythene Packing","blouse":"Unstitched"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  sku = excluded.sku,
  akm_care_price = excluded.akm_care_price,
  mrp = excluded.mrp,
  stock_quantity = excluded.stock_quantity,
  updated_at = now();

-- Upsert ROOH
insert into products (
  id, name, slug, sku, product_code, brand_id, category_id, subcategory_id,
  short_description, detailed_description, description,
  mrp, selling_price, akm_care_price, price, discount_percent,
  gst_percent, gst_number, hsn, dimensions, weight,
  stock_quantity, status, shipping_time, warranty, packing_type, freight_cost,
  category, category_label, tags,
  is_featured, is_new_arrival, is_best_seller, is_trending, popularity, display_order,
  image_url, seo_title, seo_description, specifications
) values (
  'd0000000-0000-4000-8000-000000000002',
  'AKMC ROOH - 0002',
  'akmc-rooh-0002',
  'AKMCE95',
  'AKMCE95',
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'Chanderi Print Saree with unstitched Blouse',
  'Premium Chanderi print saree (approx. 6.2 metres) with unstitched blouse piece. Elegant floral vine work, finished border, and festive-ready drape. Sourced for AKM Care — Trusted & Fair apparel.',
  'Chanderi Print Saree with unstitched Blouse',
  833, 833, 714, 714, 14,
  5, '24AIFPB2688G1ZG', '540752', '6.2 Mtrs APX', null,
  6, 'available', 'within 24 Hours', 'NA — within 7 days return policy', 'Polythene Packing', null,
  'sarees', 'Sarees', '["Chanderi","Ethnic Wear","Apparel","Print","Women","AKM Care"]'::jsonb,
  true, true, false, true, 92, 2,
  '/catalog/akmc-rooh-0002/01.png',
  'AKMC ROOH - 0002 | Chanderi Print Saree | AKM Care',
  'Buy AKMC ROOH - 0002 Chanderi print saree with unstitched blouse. AKM Care price ₹714.',
  '{"variant":"PRINT","packing":"Polythene Packing","blouse":"Unstitched"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  sku = excluded.sku,
  akm_care_price = excluded.akm_care_price,
  mrp = excluded.mrp,
  stock_quantity = excluded.stock_quantity,
  updated_at = now();

-- Unique slug conflict path if ids differ
create unique index if not exists idx_products_slug_unique on products (slug) where slug is not null;

-- Images SANI (7)
delete from product_images where product_id = 'd0000000-0000-4000-8000-000000000001';
insert into product_images (product_id, url, alt, storage_path, sort_order, is_primary)
select
  'd0000000-0000-4000-8000-000000000001',
  '/catalog/akmc-sani-1007/' || lpad(g::text, 2, '0') || '.png',
  'AKMC SANI - 1007 — view ' || g,
  'products/akmc-sani-1007/' || lpad(g::text, 2, '0') || '.png',
  g - 1,
  g = 1
from generate_series(1, 7) as g;

-- Images ROOH (8)
delete from product_images where product_id = 'd0000000-0000-4000-8000-000000000002';
insert into product_images (product_id, url, alt, storage_path, sort_order, is_primary)
select
  'd0000000-0000-4000-8000-000000000002',
  '/catalog/akmc-rooh-0002/' || lpad(g::text, 2, '0') || '.png',
  'AKMC ROOH - 0002 — view ' || g,
  'products/akmc-rooh-0002/' || lpad(g::text, 2, '0') || '.png',
  g - 1,
  g = 1
from generate_series(1, 8) as g;

-- Variants
delete from product_variants where product_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002'
);
insert into product_variants (product_id, name, stock, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'PRINT', 8, 0),
  ('d0000000-0000-4000-8000-000000000002', 'PRINT', 6, 0);

-- Colors
delete from product_colors where product_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002'
);
insert into product_colors (product_id, name, hex, slug, image_indexes, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'Off White', '#E8E6E1', 'off-white', '{0,1,2}', 0),
  ('d0000000-0000-4000-8000-000000000001', 'Light Grey', '#C8C9CA', 'light-grey', '{3,4,5,6}', 1),
  ('d0000000-0000-4000-8000-000000000002', 'Sage Green', '#8FA89A', 'sage-green', '{0,1}', 0),
  ('d0000000-0000-4000-8000-000000000002', 'Dusty Mauve', '#A88986', 'dusty-mauve', '{2,3}', 1),
  ('d0000000-0000-4000-8000-000000000002', 'Grey Embroidered', '#9A9A9A', 'grey-embroidered', '{4}', 2),
  ('d0000000-0000-4000-8000-000000000002', 'Dusty Rose', '#C49A9A', 'dusty-rose', '{5,6,7}', 3);

-- Inventory
delete from inventory where product_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002'
);
insert into inventory (product_id, warehouse_code, quantity_on_hand, quantity_reserved) values
  ('d0000000-0000-4000-8000-000000000001', 'DEFAULT', 8, 0),
  ('d0000000-0000-4000-8000-000000000002', 'DEFAULT', 6, 0);

-- Featured / related
delete from featured_products where product_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002'
);
insert into featured_products (product_id, slot, display_order) values
  ('d0000000-0000-4000-8000-000000000001', 'shop', 1),
  ('d0000000-0000-4000-8000-000000000002', 'shop', 2);

delete from related_products where product_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002'
);
insert into related_products (product_id, related_product_id, relation_type, display_order) values
  ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'related', 1),
  ('d0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'related', 1);
