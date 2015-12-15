#CartoDB data tables used in Forced Migration

**This file contains the queries used to generate each of the derived tables used by the application.** We call these tables "materialized", even though they are not technically [Materialized Views](http://www.postgresql.org/docs/9.3/static/sql-creatematerializedview.html) in the PostgreSQL sense. They are simply copies.

**Why do we do this?**
1. Using these copied tables is more efficient, because the query doesn't have to be run every time a new user loads the application.
2. They allow us to make the derived table public (so the application does not require API keys) while keeping the source data private.
3. They make the application more resilient in case the source data tables are undergoing modification or development. Using materialized tables means that the application will always be using a version of the data that is known to work.

**How to use these queries:**

1. Create a new empty table in the CartoDB web interface. This table will be used only temporarily, from which to create our materialized table.
2. Paste the SQL into the CartoDB "Custom SQL query" panel. Click "Apply query".
3. Select "Dataset from query" in the "Edit" menu.
4. Click on the name of the new table to change the name from `untitled_table_NN_copy` to `site_tablename_materialized`.
5. Select "Change privacy" in the "Edit" menu, so that the table is accessible to anyone "With link".
6. (optional) You can now delete the empty table you created in step 1.

The following sections list the names of each of the tables used by the application. The "Tables" section is a list of the source tables used by the query. The "SQL" section documents the query used to generate the derived table.


####site_countybubbles_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT area_sqmi, estimate, inmigrations, name, nhgis_join, population, prev_population, state_terr, year FROM ???
```

####site_counties_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT the_geom, county_name, key, nhgis_join, state_terr FROM ???
```

####site_countynames_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT area_sqmi, name, nhgis_join, state_terr FROM ???
```

####site_crops_materialized
**Tables:**
`crop_data`, `counties`

**SQL**
TODO: verify this

```sql
SELECT ST_Union(the_geom_webmercator) as the_geom_webmercator, a.cartodb_id, a.crop, a.year FROM (
SELECT 1 as cartodb_id, 'cotton' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator,  ((crop_data.count)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1859 AND crop_data.crop_category_id = 87 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
UNION
SELECT 2 as cartodb_id, 'cotton' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator,  ((crop_data.count)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1849 AND crop_data.crop_category_id = 87 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
UNION
SELECT 3 as cartodb_id, 'cotton' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator, ((crop_data.count/400)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1839 AND crop_data.crop_category_id = 26 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
UNION
SELECT 4 as cartodb_id, 'sugar' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator, ((crop_data.count)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1859 AND crop_data.crop_category_id = 89 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
UNION
SELECT 5 as cartodb_id, 'sugar' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator,  ((crop_data.count)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1849 AND crop_data.crop_category_id = 89 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
UNION
SELECT 6 as cartodb_id, 'sugar' AS crop, ST_Transform(counties.the_geom_webmercator,2163) as the_geom_webmercator, ((crop_data.count/400)/counties.area_sqmi) AS crop_density, crop_data.year FROM counties JOIN crop_data ON counties.nhgis_join = crop_data.nhgis_join WHERE area_sqmi > 0 AND crop_data.year = 1839 AND crop_data.crop_category_id = 29 AND crop_data.year * 10000 + 0101 >= start_n AND crop_data.year * 10000 + 0101 < end_n
) a WHERE crop_density > 10 group by a.cartodb_id, a.crop, a.year
```

####site_cropdetails_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT cartodb_id, count, crop_category_id, nhgis_join, year FROM ???
```

####site_hexbins_materialized
**Tables:**
`hexbin_forced_migration` (which itself needs to be documented)

**SQL**
TODO
```sql
SELECT *, ST_X(ST_Centroid(ST_Transform(ST_SetSRID(ST_Transform(the_geom,2163),3857),4326))) as long, ST_Y(ST_Centroid(ST_Transform(ST_SetSRID(ST_Transform(the_geom,2163),3857),4326))) as lat, ST_X(ST_Centroid(the_geom)) as longMerc, ST_Y(ST_Centroid(the_geom)) as latMerc
FROM hexbin_forced_migration
WHERE pop_1860 > 0
```

####site_inmigration_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT cartodb_id, estimate, inmigrations, nhgis_join, population, prev_population, year FROM ???
```


####site_narratives_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT cartodb_id, the_geom, description, location, name, narrative_id, year FROM ???
```


####site_statelabels_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT cartodb_id, the_geom, statenam FROM ???
```

####site_states_materialized
**Tables:**
TODO

**SQL**
TODO
```sql
SELECT cartodb_id, the_geom, key, statenam, year FROM ???
```

