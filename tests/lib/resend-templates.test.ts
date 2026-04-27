// Resend email template render tests. Pure functions, no env, no network.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { marketDayReminderTemplate } from "../../lib/resend/templates/market-day-reminder.ts";
import { postMarketSurveyTemplate } from "../../lib/resend/templates/post-market-survey.ts";
import { applicationApprovedTemplate } from "../../lib/resend/templates/application-approved.ts";
import { applicationReceivedTemplate } from "../../lib/resend/templates/application-received.ts";
import { paymentConfirmationTemplate } from "../../lib/resend/templates/payment-confirmation.ts";
import { welcomeTemplate } from "../../lib/resend/templates/welcome.ts";

function assertValidEmail(out: { subject: string; html: string; text: string }): void {
  assert.ok(out.subject.length > 0, "subject empty");
  assert.ok(out.html.length > 0, "html empty");
  assert.ok(out.text.length > 0, "text empty");
  assert.match(out.html, /<\!doctype html>/i, "html missing doctype");
  assert.match(out.html, /<html/i);
  assert.match(out.html, /<\/html>/i);
  assert.match(out.html, /<body/i);
  assert.match(out.html, /<\/body>/i);
  assert.ok(!out.html.includes("—"), "html contains emdash");
  assert.ok(!out.text.includes("—"), "text contains emdash");
}

describe("resend templates", () => {
  it("market-day-reminder substitutes variables", () => {
    const out = marketDayReminderTemplate({
      vendorName: "Tinsel & Twine",
      location: "Easton Park",
      date: "May 4",
      setupTime: "9:30 AM",
      boothNumber: "A-7",
      mapUrl: "https://mmm/maps/easton-may4.pdf",
    });
    assertValidEmail(out);
    assert.match(out.subject, /Easton Park/);
    assert.match(out.subject, /May 4/);
    assert.match(out.html, /Tinsel &amp; Twine/);
    assert.match(out.html, /A-7/);
    assert.match(out.html, /9:30 AM/);
    assert.match(out.html, /maps\/easton-may4\.pdf/);
  });

  it("market-day-reminder omits booth and map blocks when not provided", () => {
    const out = marketDayReminderTemplate({
      vendorName: "X",
      location: "Y",
      date: "Z",
      setupTime: "08:00",
    });
    assertValidEmail(out);
    assert.doesNotMatch(out.html, /booth assignment/i);
    assert.doesNotMatch(out.html, /vendor map/i);
  });

  it("post-market-survey renders survey URL", () => {
    const out = postMarketSurveyTemplate({
      vendorName: "Vendor",
      location: "Wolf Ranch",
      surveyUrl: "https://mmm/survey/abc",
    });
    assertValidEmail(out);
    assert.match(out.html, /https:\/\/mmm\/survey\/abc/);
    assert.match(out.subject, /Wolf Ranch/);
  });

  it("application-received and application-approved render", () => {
    const received = applicationReceivedTemplate({
      vendorName: "V",
      location: "L",
      date: "May 4",
    });
    assertValidEmail(received);

    const approved = applicationApprovedTemplate({
      vendorName: "V",
      location: "L",
      date: "May 4",
      waiverUrl: "https://mmm/sign/abc",
      portalUrl: "https://mmm/portal?token=xyz",
    });
    assertValidEmail(approved);
    assert.match(approved.html, /sign\/abc/);
  });

  it("payment-confirmation renders amount and event", () => {
    const out = paymentConfirmationTemplate({
      vendorName: "V",
      amount: "$50.00",
      location: "Easton Park",
      date: "May 4",
    });
    assertValidEmail(out);
    assert.match(out.html, /\$50\.00/);
    assert.match(out.html, /Easton Park/);
  });

  it("welcome renders portal link", () => {
    const out = welcomeTemplate({
      vendorName: "V",
      portalUrl: "https://mmm/portal",
    });
    assertValidEmail(out);
    assert.match(out.html, /portal/);
  });

  it("html escaping prevents script injection", () => {
    const out = marketDayReminderTemplate({
      vendorName: "<script>alert(1)</script>",
      location: "L",
      date: "D",
      setupTime: "T",
    });
    assert.ok(!out.html.includes("<script>"), "script tag was not escaped");
    assert.match(out.html, /&lt;script&gt;/);
  });
});
