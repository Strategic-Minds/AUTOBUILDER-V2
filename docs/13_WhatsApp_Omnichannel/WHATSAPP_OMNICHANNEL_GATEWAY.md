# WhatsApp Omnichannel Gateway

## Purpose
Add WhatsApp as a first-class channel for lead intake, proposal follow-up, appointment reminders, support, and conversational sales while preserving consent, template, opt-out, human escalation, and receipt rules.

## Supported provider paths
1. Meta WhatsApp Business Platform Cloud API
2. Twilio WhatsApp Business Platform
3. Future BSP provider adapter

## Core capabilities
- Register WhatsApp sender and WABA metadata.
- Store approved template catalog.
- Receive inbound webhook messages.
- Classify intent: lead, support, estimate, appointment, complaint, opt-out, human-request, spam.
- Route to the correct tenant, location, agent, and queue.
- Gate outbound messages behind consent and template approval.
- Log every inbound and outbound message as a communication receipt.
- Escalate to human when confidence is low, user requests human help, legal/safety/payment issue occurs, or templates are missing.

## Required Supabase tables
- communication_channels
- whatsapp_senders
- whatsapp_templates
- message_threads
- message_events
- consent_ledger
- opt_outs
- human_escalations
- webhook_receipts

## Required Vercel routes
- /api/webhooks/whatsapp/meta
- /api/webhooks/whatsapp/twilio
- /api/messages/send/whatsapp
- /api/messages/inbox/route
- /api/messages/escalate

## Outbound message gate
Before any outbound WhatsApp message:
1. Verify tenant.
2. Verify channel is active.
3. Verify recipient consent.
4. Verify opt-out status.
5. Verify template approval when outside allowed conversation window or for notification/marketing templates.
6. Verify human approval for sales, pricing, legal, complaint, refund, high-risk, or bulk send.
7. Write dry-run receipt.
8. Execute only when approved.

## Template categories
- lead_followup
- estimate_received
- proposal_ready
- appointment_reminder
- photo_request
- measurement_request
- support_acknowledgement
- human_handoff
- review_request
- opt_in_confirmation
- opt_out_confirmation

## Default identity mapping
- support@nationalepoxypros.com -> support and human escalation
- leads@nationalepoxypros.com -> inbound lead automation and AI routing
- ai@autobuilderos.com -> internal agent operations
- jeremy@autobuilderos.com -> operator/admin approvals

## Safety rules
- Never message a customer without consent.
- Never publish/send bulk WhatsApp campaigns without approval.
- Never bypass template approval requirements.
- Never continue automation after STOP / unsubscribe / opt-out.
- Never discuss legal, medical, financial, or safety claims without human escalation.
