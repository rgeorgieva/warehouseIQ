-- Seed: inventory (from Inventory.xlsx)
insert into public.inventory (item_name, category, stock_level, reorder_point, price, supplier_email) values
  ('X-1000 Power Processor',    'Electronics', 12, 15, 299.99, 'support@techparts.com'),
  ('G-Pro Graphics Card',       'Electronics',  5,  8, 599.00, 'sales@visiongear.com'),
  ('High-Speed Cooling Fan',    'Components',   3, 10,  15.25, 'info@coolingsys.net'),
  ('Industrial Grade Sensor',   'Components',  20, 12,  89.50, 'orders@oemcorp.com'),
  ('Secure Cloud Hub',          'Networking',   7,  5, 1249.00,'b2b@securecloud.io')
on conflict ((lower(item_name))) do nothing;
