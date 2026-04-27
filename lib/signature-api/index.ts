export {
  isSignatureApiConfigured,
  getSignatureApiKey,
  getSignatureApiBaseUrl,
  getSignatureWebhookSecret,
  signatureApiRequest,
  type SignatureApiResponse,
  type SignatureApiRequestOptions,
} from "./client";
export {
  createContract,
  sendForSignature,
  getStatus,
  downloadSignedDocument,
  type CreateContractInput,
  type ContractEnvelope,
  type ContractStatus,
} from "./contracts";
export {
  getTemplateIdForLocation,
  normalizeLocationSlug,
  LOCATION_SLUGS,
  type LocationSlug,
} from "./templates";
