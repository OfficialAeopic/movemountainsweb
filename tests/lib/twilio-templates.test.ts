// Twilio SMS template render tests. Pure functions, no env, no network.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  smsTemplates,
  renderSmsTemplate,
} from "../../lib/twilio/templates.ts";

describe("twilio templates", () => {
  it("payment_reminder_24h substitutes vendor, location, and date", () => {
    const out = smsTemplates.payment_reminder_24h({
      vendorName: "Sourdough Sam",
      location: "Easton Park",
      date: "May 4",
    });
    assert.match(out, /Sourdough Sam/);
    assert.match(out, /Easton Park/);
    assert.match(out, /May 4/);
    assert.match(out, /Move Mountains Market/);
  });

  it("payment_reminder_tuesday uses default phone when none provided", () => {
    const out = smsTemplates.payment_reminder_tuesday({
      vendorName: "Beeswax Co",
      location: "Whisper Valley",
      date: "May 18",
    });
    assert.match(out, /512-612-8850/);
  });

  it("payment_reminder_tuesday uses override phone when provided", () => {
    const out = smsTemplates.payment_reminder_tuesday({
      vendorName: "Beeswax Co",
      location: "Whisper Valley",
      date: "May 18",
      payToPhone: "555-1212",
    });
    assert.match(out, /555-1212/);
    assert.doesNotMatch(out, /512-612-8850/);
  });

  it("map_posted includes the booth number", () => {
    const out = smsTemplates.map_posted({
      vendorName: "Pottery Place",
      location: "Wolf Ranch",
      date: "Jun 5",
      boothNumber: "B-12",
    });
    assert.match(out, /B-12/);
  });

  it("survey_request omits next-month line when not provided", () => {
    const out = smsTemplates.survey_request({
      location: "Goodnight Ranch",
      surveyLink: "https://mmm/survey/abc",
    });
    assert.match(out, /Goodnight Ranch/);
    assert.match(out, /https:\/\/mmm\/survey\/abc/);
    assert.doesNotMatch(out, /Reply YES/);
  });

  it("survey_request includes next-month line when provided", () => {
    const out = smsTemplates.survey_request({
      location: "Goodnight Ranch",
      surveyLink: "https://mmm/survey/abc",
      nextMonth: "June",
    });
    assert.match(out, /Reply YES/);
    assert.match(out, /June/);
  });

  it("approval renders waiver link", () => {
    const out = smsTemplates.approval({
      vendorName: "Vendor",
      waiverLink: "https://mmm/sign/xyz",
    });
    assert.match(out, /https:\/\/mmm\/sign\/xyz/);
  });

  it("payment_due renders amount, due date, and pay link", () => {
    const out = smsTemplates.payment_due({
      vendorName: "Vendor",
      amount: "$45.00",
      dueDate: "Apr 30",
      payLink: "https://mmm/pay/abc",
    });
    assert.match(out, /\$45\.00/);
    assert.match(out, /Apr 30/);
    assert.match(out, /https:\/\/mmm\/pay\/abc/);
  });

  it("renderSmsTemplate dispatches correctly", () => {
    const out = renderSmsTemplate("payment_reminder_24h", {
      vendorName: "X",
      location: "Y",
      date: "Z",
    });
    assert.match(out, /X/);
    assert.match(out, /Y/);
    assert.match(out, /Z/);
  });

  it("renderSmsTemplate custom returns the message field verbatim", () => {
    const out = renderSmsTemplate("custom", { message: "raw text only" });
    assert.equal(out, "raw text only");
  });

  it("templates do not contain emdashes", () => {
    const samples = [
      smsTemplates.payment_reminder_24h({
        vendorName: "A",
        location: "B",
        date: "C",
      }),
      smsTemplates.payment_reminder_tuesday({
        vendorName: "A",
        location: "B",
        date: "C",
      }),
      smsTemplates.map_posted({
        vendorName: "A",
        location: "B",
        date: "C",
        boothNumber: "1",
      }),
      smsTemplates.survey_request({
        location: "A",
        surveyLink: "B",
      }),
      smsTemplates.approval({ vendorName: "A", waiverLink: "B" }),
      smsTemplates.payment_due({
        vendorName: "A",
        amount: "B",
        dueDate: "C",
        payLink: "D",
      }),
    ];
    for (const s of samples) {
      assert.ok(!s.includes("—"), `emdash found in: ${s}`);
    }
  });
});
