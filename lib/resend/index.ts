export {
  getResendClient,
  isResendConfigured,
  getDefaultFromAddress,
} from "./client";
export {
  sendEmail,
  sendCampaign,
  sendWithAttachment,
  type SendEmailInput,
  type SendEmailResult,
  type SendCampaignInput,
  type SendCampaignRecipient,
  type EmailAttachment,
} from "./email";
export * from "./templates";
