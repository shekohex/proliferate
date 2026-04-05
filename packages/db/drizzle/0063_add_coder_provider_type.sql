ALTER TABLE "configurations" DROP CONSTRAINT "configurations_sandbox_provider_check";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_sandbox_provider_check";--> statement-breakpoint
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_sandbox_provider_check" CHECK (sandbox_provider = ANY (ARRAY['modal'::text, 'e2b'::text, 'coder'::text]));--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_sandbox_provider_check" CHECK (sandbox_provider = ANY (ARRAY['modal'::text, 'e2b'::text, 'coder'::text]));