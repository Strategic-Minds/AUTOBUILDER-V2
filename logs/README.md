# logs/

Placeholder for structured run logs if/when workers run outside the Base44 automation
system (e.g. after a Vercel deploy). Today, run history lives in: Base44 automation run
history (heartbeat/sync/test/nightly), ValidationRegistry, ScoringRegistry, and
factory_receipts in Supabase (written by every adapter run - see workers/adapters/base.ts).
