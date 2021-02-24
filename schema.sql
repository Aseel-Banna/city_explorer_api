DROP TABLE IF EXISTS locations;
CREATE TABLE locations (
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(20, 14),
  longitude NUMERIC(20, 14)
);

-- INSERT INTO locations (search_query, formatted_query, latitude,longitude) VALUES ('amman', 'Amman', 35.9106, 31.9539);

