CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE TABLE "food_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"alias" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"serving_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_meals" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "food_aliases" ADD CONSTRAINT "food_aliases_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_favorites" ADD CONSTRAINT "food_favorites_serving_id_servings_id_fk" FOREIGN KEY ("serving_id") REFERENCES "public"."servings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "food_aliases_food_alias_unique" ON "food_aliases" USING btree ("food_id","alias");--> statement-breakpoint
CREATE INDEX "food_aliases_alias_idx" ON "food_aliases" USING btree ("alias");--> statement-breakpoint
CREATE UNIQUE INDEX "food_favorites_food_serving_unique" ON "food_favorites" USING btree ("food_id","serving_id");--> statement-breakpoint
CREATE INDEX "food_favorites_food_id_idx" ON "food_favorites" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_favorites_serving_id_idx" ON "food_favorites" USING btree ("serving_id");--> statement-breakpoint
CREATE INDEX "foods_name_trgm_idx" ON "foods" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "foods_brand_trgm_idx" ON "foods" USING gin (lower("brand") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "food_aliases_alias_trgm_idx" ON "food_aliases" USING gin (lower("alias") gin_trgm_ops);
