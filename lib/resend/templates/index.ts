export { welcomeTemplate, type WelcomeVars } from "./welcome";
export {
  applicationReceivedTemplate,
  type ApplicationReceivedVars,
} from "./application-received";
export {
  applicationApprovedTemplate,
  type ApplicationApprovedVars,
} from "./application-approved";
export {
  paymentConfirmationTemplate,
  type PaymentConfirmationVars,
} from "./payment-confirmation";
export {
  marketDayReminderTemplate,
  type MarketDayReminderVars,
} from "./market-day-reminder";
export {
  postMarketSurveyTemplate,
  type PostMarketSurveyVars,
} from "./post-market-survey";

export type EmailTemplateKey =
  | "welcome"
  | "application_received"
  | "application_approved"
  | "payment_confirmation"
  | "market_day_reminder"
  | "post_market_survey";
