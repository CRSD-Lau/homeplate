DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM "data_sources"
    WHERE "source_type" = 'open_food_facts'
  ) > 1 THEN
    RAISE EXCEPTION 'Cannot create data_sources_open_food_facts_unique: multiple Open Food Facts data_sources rows exist. Resolve duplicates manually before applying this migration.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX "data_sources_open_food_facts_unique" ON "data_sources" USING btree ("source_type") WHERE "data_sources"."source_type" = 'open_food_facts';
