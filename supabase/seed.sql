-- Move Mountains CRM seed v1
-- 4 locations + vendor types + product categories + 6 musicians + space types
-- Pricing in space_types is provisional, must be confirmed with Amanda before launch.

-- LOCATIONS
insert into locations (slug, name, address, city, zip, schedule_description, schedule_day_of_week, schedule_week_of_month, open_time, close_time, summer_open_time, summer_close_time, max_vendors, property_management, active) values
('easton-park', 'Easton Park', '7800 Apogee Blvd', 'Austin', '78744', 'First Sundays, 11AM-3PM (Summer 10AM-2PM)', 'sunday', 1, '11:00', '15:00', '10:00', '14:00', 80, 'Cohere Life / Brookfield Residential', true),
('whisper-valley', 'Whisper Valley', '9400 Petrichor Blvd', 'Manor', '78653', 'Third Sundays, 11AM-3PM', 'sunday', 3, '11:00', '15:00', '11:00', '15:00', 35, 'FirstService Residential', true),
('goodnight-ranch', 'Goodnight Ranch', '5601 Baythorne Drive', 'Austin', '78744', 'Second Sundays, 11AM-3PM', 'sunday', 2, '11:00', '15:00', '11:00', '15:00', 45, 'TBD', true),
('wolf-ranch', 'Wolf Ranch', '101 River Overlook Rd', 'Georgetown', '78628', 'First Thursdays, 5:30-8:30PM', 'thursday', 1, '17:30', '20:30', '17:30', '20:30', null, 'FirstService Residential', true);

-- VENDOR TYPES
insert into vendor_types (slug, name, description, base_price, requires_permits) values
('standard', 'Standard Artisan', 'Handcraft, art, jewelry, soaps, etc.', null, false),
('agricultural', 'Agricultural Producer', 'Farm goods, produce, eggs, plants', 20, false),
('kid-teen', 'Kid/Teen Entrepreneur', 'Young entrepreneur tier', 25, false),
('ice-cream', 'Ice Cream / Snow Cone', 'Frozen treats vendor', 50, false),
('hot-food', 'Hot Food', 'Cooked food, requires permits and food manager cert', 75, true),
('food-truck', 'Food Truck', 'Mobile food unit, requires permits and food manager cert', 100, true);

-- PRODUCT CATEGORIES
insert into product_categories (slug, name) values
('candles', 'Candles'),
('baked-goods', 'Baked Goods'),
('jewelry', 'Jewelry'),
('skincare', 'Skincare'),
('pet-products', 'Pet Products'),
('plants', 'Plants'),
('art', 'Art'),
('clothing', 'Clothing'),
('home-decor', 'Home Decor'),
('eggs-produce', 'Eggs Produce'),
('hot-food', 'Hot Food'),
('drinks', 'Drinks'),
('books', 'Books'),
('crafts', 'Crafts');

-- MUSICIANS
insert into musicians (name, handle, website) values
('Aaron Cook', '@aaroncantcook', null),
('Brian Wolff', null, 'brianwolffmusic.com'),
('Dani The Violinist', '@dmcviolin', null),
('JustHannah', null, 'justhannah.live'),
('Mike Kiddoo', null, 'mikekiddoo.com'),
('Nick Adamo', null, 'nickadamo.net');

-- SPACE TYPES per location (provisional pricing, confirm with Amanda)
-- Easton Park: pavilion + tent
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Pavilion 10x10', 'pavilion-10', 'Covered pavilion booth', 65, 55, 40, 1 from locations where slug = 'easton-park';
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Tent 10x10', 'tent-10', 'Open-air booth, vendor brings tent', 55, 45, 40, 2 from locations where slug = 'easton-park';

-- Whisper Valley: pavilion + indoor
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Pavilion 10x10', 'pavilion-10', 'Covered pavilion booth', 65, 55, 20, 1 from locations where slug = 'whisper-valley';
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Indoor Booth', 'indoor', 'Climate-controlled indoor space', 75, 65, 15, 2 from locations where slug = 'whisper-valley';

-- Goodnight Ranch: tent only
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Tent 10x10', 'tent-10', 'Open-air booth, vendor brings tent', 55, 45, 45, 1 from locations where slug = 'goodnight-ranch';

-- Wolf Ranch: top deck
insert into space_types (location_id, name, slug, description, price_first_market, price_recurring, capacity, display_order)
select id, 'Top Deck Booth', 'top-deck', 'Top deck open-air booth', 65, 55, 30, 1 from locations where slug = 'wolf-ranch';
