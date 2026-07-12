# Omnichannel Operating Model

## Channels
- Website forms
- Website chat
- WhatsApp
- SMS
- Email
- Google Calendar
- Social DMs
- Phone-call notes/manual intake

## Routing flow
Inbound event -> webhook receipt -> normalize -> identify tenant/location/contact -> consent check -> classify -> assign queue -> agent response draft -> approval gate if required -> send/log/escalate.

## Queues
- leads.new
- leads.needs_photos
- leads.proposal_ready
- support.new
- support.escalated
- appointments.pending
- social.inbox
- optout.processed
- failed.webhooks

## Human escalation triggers
- confidence < 0.82
- explicit human request
- angry or complaint language
- legal/payment/refund issue
- safety issue
- opt-out request
- pricing negotiation
- customer data deletion/export request
- unapproved outbound template
