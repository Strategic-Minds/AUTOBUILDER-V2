# WhatsApp Template Catalog

## Required template manifest fields
- template_key
- provider_template_id
- provider: meta | twilio | other
- category: utility | marketing | authentication | service
- language
- status: draft | submitted | approved | rejected | paused
- variables
- example_body
- use_case
- approval_required
- tenant_scope
- location_scope
- last_verified_at

## Starter templates

### estimate_photo_request
Purpose: ask a lead to submit jobsite photos and measurements.
Variables: first_name, business_name, upload_link
Gate: consent required, lead thread only.

### proposal_ready
Purpose: notify the lead that a proposal is ready.
Variables: first_name, proposal_link, expiration_date
Gate: consent required, utility template approval required.

### appointment_reminder
Purpose: remind customer about scheduled appointment.
Variables: first_name, appointment_date, appointment_time, location_name
Gate: consent required.

### human_handoff
Purpose: tell customer a human specialist is joining.
Variables: first_name, support_name
Gate: human escalation event required.

### opt_out_confirmation
Purpose: confirm unsubscribe/STOP.
Variables: none
Gate: immediate required after opt-out.
