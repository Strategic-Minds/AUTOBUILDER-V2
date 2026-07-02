# Consent and Compliance Ledger

## Purpose
Track permission to contact people across channels and tenants.

## Consent records
- contact_id
- tenant_id
- channel: whatsapp | sms | email | phone | social_dm
- source: form | import | verbal | manual | integration | opt_in_message
- consent_status: opted_in | opted_out | pending | unknown
- consent_text
- ip_address
- user_agent
- timestamp
- jurisdiction
- proof_url
- revoked_at

## Rules
- Default unknown consent to no outbound automation.
- Preserve opt-out permanently unless contact opts back in.
- Treat WhatsApp, SMS, and marketing email as separate consent categories.
- Store the exact consent language used.
- Require human review for imported contact lists.
