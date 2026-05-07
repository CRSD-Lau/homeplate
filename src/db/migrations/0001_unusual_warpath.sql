CREATE TYPE "public"."step_source" AS ENUM('manual');--> statement-breakpoint
ALTER TYPE "public"."meal_type" RENAME TO "meal_type_old";--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'snack');--> statement-breakpoint
ALTER TABLE "food_logs" ALTER COLUMN "meal_type" TYPE "public"."meal_type" USING (
	CASE WHEN "meal_type"::text = 'snack' THEN 'afternoon_snack' ELSE "meal_type"::text END
)::"public"."meal_type";--> statement-breakpoint
ALTER TABLE "saved_meals" ALTER COLUMN "meal_type" TYPE "public"."meal_type" USING (
	CASE WHEN "meal_type"::text = 'snack' THEN 'afternoon_snack' ELSE "meal_type"::text END
)::"public"."meal_type";--> statement-breakpoint
DROP TYPE "public"."meal_type_old";--> statement-breakpoint
CREATE TABLE "step_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"log_date" date NOT NULL,
	"steps" integer NOT NULL,
	"source" "step_source" DEFAULT 'manual' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "goal_weight_kg" double precision;--> statement-breakpoint
ALTER TABLE "step_logs" ADD CONSTRAINT "step_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "step_logs_user_date_idx" ON "step_logs" USING btree ("user_id","log_date");
