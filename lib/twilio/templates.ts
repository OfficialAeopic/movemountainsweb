// SMS message templates per the MMM CRM blueprint v1, Twilio section.
// Templates are pure functions to keep them testable. No DB calls here.
// Voice: direct, second-person, signed by "Move Mountains Market".

export type SmsTemplateKey =
  | "payment_reminder_24h"
  | "payment_reminder_tuesday"
  | "map_posted"
  | "survey_request"
  | "approval"
  | "payment_due"
  | "custom";

export interface PaymentReminder24hVars {
  vendorName: string;
  location: string;
  date: string;
}

export interface PaymentReminderTuesdayVars {
  vendorName: string;
  location: string;
  date: string;
  payToPhone?: string;
}

export interface MapPostedVars {
  vendorName: string;
  location: string;
  date: string;
  boothNumber: string;
}

export interface SurveyRequestVars {
  location: string;
  surveyLink: string;
  nextMonth?: string;
}

export interface ApprovalVars {
  vendorName: string;
  waiverLink: string;
}

export interface PaymentDueVars {
  vendorName: string;
  amount: string;
  dueDate: string;
  payLink: string;
}

export const smsTemplates = {
  payment_reminder_24h(v: PaymentReminder24hVars): string {
    return [
      `Hi ${v.vendorName}! Your spot at ${v.location} on ${v.date} isn't confirmed yet.`,
      `Please submit payment within 24 hours to reserve your booth.`,
      `Questions? Reply to this text.`,
      `- Move Mountains Market`,
    ].join("\n");
  },

  payment_reminder_tuesday(v: PaymentReminderTuesdayVars): string {
    const phone = v.payToPhone ?? "512-612-8850";
    return [
      `Hi ${v.vendorName}! Friendly reminder: payment for ${v.location} on ${v.date} is due by Tuesday.`,
      `Pay via Zelle, Venmo, or CashApp to ${phone}.`,
      `- Move Mountains Market`,
    ].join("\n");
  },

  map_posted(v: MapPostedVars): string {
    return [
      `${v.vendorName}, your vendor map for ${v.location} on ${v.date} is ready!`,
      `Check your email or portal for your booth assignment: ${v.boothNumber}.`,
      `- Move Mountains Market`,
    ].join("\n");
  },

  survey_request(v: SurveyRequestVars): string {
    const next = v.nextMonth ? `Interested in ${v.nextMonth}? Reply YES to confirm.` : "";
    return [
      `Thanks for vending at ${v.location}!`,
      `Share feedback here: ${v.surveyLink}`,
      next,
      `- Move Mountains Market`,
    ]
      .filter(Boolean)
      .join("\n");
  },

  approval(v: ApprovalVars): string {
    return [
      `Hi ${v.vendorName}! Your application was approved.`,
      `Sign your liability waiver here: ${v.waiverLink}`,
      `- Move Mountains Market`,
    ].join("\n");
  },

  payment_due(v: PaymentDueVars): string {
    return [
      `Hi ${v.vendorName}, payment of ${v.amount} is due ${v.dueDate}.`,
      `Pay here: ${v.payLink}`,
      `- Move Mountains Market`,
    ].join("\n");
  },
};

export function renderSmsTemplate(
  key: SmsTemplateKey,
  vars: Record<string, string>
): string {
  switch (key) {
    case "payment_reminder_24h":
      return smsTemplates.payment_reminder_24h(vars as unknown as PaymentReminder24hVars);
    case "payment_reminder_tuesday":
      return smsTemplates.payment_reminder_tuesday(
        vars as unknown as PaymentReminderTuesdayVars
      );
    case "map_posted":
      return smsTemplates.map_posted(vars as unknown as MapPostedVars);
    case "survey_request":
      return smsTemplates.survey_request(vars as unknown as SurveyRequestVars);
    case "approval":
      return smsTemplates.approval(vars as unknown as ApprovalVars);
    case "payment_due":
      return smsTemplates.payment_due(vars as unknown as PaymentDueVars);
    case "custom":
      return vars.message ?? "";
    default:
      return "";
  }
}
