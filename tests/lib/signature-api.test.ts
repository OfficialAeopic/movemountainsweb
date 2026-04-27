// SignatureAPI client tests in stub mode. No env, no network.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { isolateEnv } from "../_shim/env.ts";
import {
  createContract,
  sendForSignature,
  getStatus,
  downloadSignedDocument,
} from "../../lib/signature-api/contracts.ts";
import {
  getTemplateIdForLocation,
  normalizeLocationSlug,
  LOCATION_SLUGS,
} from "../../lib/signature-api/templates.ts";

describe("signature-api templates", () => {
  it("normalizeLocationSlug accepts canonical slugs", () => {
    for (const s of LOCATION_SLUGS) {
      assert.equal(normalizeLocationSlug(s), s);
    }
  });

  it("normalizeLocationSlug fuzzy-matches display names", () => {
    assert.equal(normalizeLocationSlug("Easton Park"), "easton_park");
    assert.equal(normalizeLocationSlug("WHISPER VALLEY"), "whisper_valley");
    assert.equal(normalizeLocationSlug("Wolf Ranch (Top Deck)"), "wolf_ranch");
    assert.equal(normalizeLocationSlug("Goodnight Ranch"), "goodnight_ranch");
  });

  it("normalizeLocationSlug returns null for unknown input", () => {
    assert.equal(normalizeLocationSlug("Times Square"), null);
  });

  it("getTemplateIdForLocation falls back when env override is missing", () => {
    delete process.env.SIGNATURE_TEMPLATE_EASTON_PARK;
    assert.equal(getTemplateIdForLocation("easton_park"), "tpl_easton_park");
  });

  it("getTemplateIdForLocation honors env override", () => {
    process.env.SIGNATURE_TEMPLATE_EASTON_PARK = "tpl_override_xyz";
    assert.equal(getTemplateIdForLocation("easton_park"), "tpl_override_xyz");
    delete process.env.SIGNATURE_TEMPLATE_EASTON_PARK;
  });
});

describe("signature-api createContract (stub mode)", () => {
  before(() => {
    isolateEnv();
  });
  after(() => {
    isolateEnv();
  });

  it("createContract returns a stub envelope when key missing", async () => {
    const out = await createContract({
      location: "easton_park",
      signerName: "Amanda A",
      signerEmail: "amanda@example.test",
    });
    assert.equal(out.stub, true);
    assert.match(out.envelopeId, /^stub_\d+_easton_park$/);
    assert.equal(out.status, "stub");
    assert.equal(out.signUrl, null);
    assert.equal(out.templateId, "tpl_easton_park");
  });

  it("createContract throws on unknown location", async () => {
    await assert.rejects(
      () =>
        createContract({
          location: "atlantis",
          signerName: "X",
          signerEmail: "x@example.test",
        }),
      /Unknown location/
    );
  });

  it("sendForSignature is an alias for createContract", async () => {
    const out = await sendForSignature({
      location: "wolf_ranch",
      signerName: "Vendor",
      signerEmail: "v@example.test",
    });
    assert.equal(out.stub, true);
    assert.equal(out.templateId, "tpl_wolf_ranch");
  });

  it("getStatus returns a stub status when key missing", async () => {
    const out = await getStatus("stub_envelope_123");
    assert.equal(out.stub, true);
    assert.equal(out.envelopeId, "stub_envelope_123");
    assert.equal(out.signedDocumentUrl, null);
  });

  it("downloadSignedDocument returns a null buffer in stub mode", async () => {
    const out = await downloadSignedDocument("stub_envelope_123");
    assert.equal(out.stub, true);
    assert.equal(out.buffer, null);
    assert.equal(out.contentType, "application/pdf");
  });

  it("createContract accepts display-name location strings", async () => {
    const out = await createContract({
      location: "Whisper Valley",
      signerName: "X",
      signerEmail: "x@example.test",
    });
    assert.equal(out.templateId, "tpl_whisper_valley");
  });
});
