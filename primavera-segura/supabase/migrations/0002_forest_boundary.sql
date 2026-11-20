-- Forest boundary. PLACEHOLDER rectangle (same as src/lib/validation.ts FOREST_BOUNDS).
-- Replace with the official La Primavera polygon provided by Más Bosque Manu / CONANP before production.
insert into public.forest_boundary (id, geom) values (
  1,
  st_geogfromtext('POLYGON((-103.67 20.60, -103.45 20.60, -103.45 20.78, -103.67 20.78, -103.67 20.60))')
)
on conflict (id) do update set geom = excluded.geom;

insert into public.trails (name) values
  ('Las Planillas'), ('El Colli'), ('Río Caliente'), ('La Cebada'), ('Cerro El Tecolote'), ('Arroyo Seco')
on conflict (name) do nothing;
