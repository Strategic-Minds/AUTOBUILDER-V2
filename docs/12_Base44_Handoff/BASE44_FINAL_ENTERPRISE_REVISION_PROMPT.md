# Base44 Final Enterprise Revision Prompt

Install AUTO_BUILDER_MASTER_OS_ENTERPRISE_FINAL into Strategic-Minds/AUTO_BUILDER on a new branch only.

Do not deploy production. Do not apply Supabase migrations. Do not create Google Workspace users, aliases, groups, folders, shared drives, or email routing. Do not send WhatsApp, SMS, email, or social messages. Do not change DNS. Do not spend money. Do not commit secrets.

Validate and scaffold:
1. Existing master OS package remains intact.
2. WhatsApp omnichannel gateway docs and API route stubs exist.
3. Consent ledger migration exists.
4. Message events, threads, senders, templates, and human escalations exist in migration.
5. Omnichannel inbox routing model exists.
6. Enterprise security matrix exists.
7. Observability and FinOps docs exist.
8. Auto-heal enterprise policy exists.
9. Agent evals and red-team docs exist.
10. Release train and disaster recovery docs exist.
11. All new enterprise skills exist under .agents/skills.
12. ENV_EXAMPLE contains WhatsApp/Twilio/Meta placeholders but no real secrets.
13. Produce receipts under 03_Bridge_Receipts.
14. Stop for Jeremy approval before live provisioning or production action.

After validation, report: VERIFIED, INFERRED, COULD NOT VERIFY, BLOCKERS, WORKAROUNDS, NEXT ACTIONS.
