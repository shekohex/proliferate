ALTER TABLE "configurations" ADD COLUMN "refresh_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "configurations" ADD COLUMN "refresh_interval_minutes" integer DEFAULT 360 NOT NULL;
ALTER TABLE "configurations" ADD COLUMN "last_refreshed_at" timestamp with time zone;
