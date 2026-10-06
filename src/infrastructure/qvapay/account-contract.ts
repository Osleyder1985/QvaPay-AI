export interface QvaPayAccountUser {
  readonly uuid: string;
  readonly username: string;
  readonly name: string | null;
  readonly image: string | null;
  readonly ratingAvg: number | null;
  readonly ratingCount: number | null;
  readonly kyc: boolean | null;
  readonly vip: boolean | null;
  readonly goldenCheck: boolean | null;
  readonly phoneVerified: boolean | null;
  readonly telegramVerified: boolean | null;
  readonly completedAsOwner: number | null;
  readonly completedAsPeer: number | null;
}

export interface QvaPayApplicationIdentity {
  readonly uuid: string;
  readonly name: string;
  readonly url: string | null;
  readonly description: string | null;
  readonly callback: string | null;
  readonly successUrl: string | null;
  readonly cancelUrl: string | null;
  readonly logo: string | null;
  readonly appPhotoUrl: string | null;
  readonly active: boolean | null;
  readonly enabled: boolean | null;
  readonly card: boolean | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export type QvaPayAccountIntegrationStatus = "verified" | "degraded" | "failed";

export interface QvaPayAccountSnapshot {
  readonly balanceUsd: number | null;
  readonly balanceHttpStatus: number;
  readonly balanceOk: boolean;
  readonly balanceError: string | null;
  readonly identity: QvaPayAccountUser | null;
  readonly identityHttpStatus: number;
  readonly identityOk: boolean;
  readonly identityError: string | null;
  readonly application: QvaPayApplicationIdentity | null;
  readonly applicationHttpStatus: number;
  readonly applicationOk: boolean;
  readonly p2pAccessible: boolean;
  readonly ownOffersTotal: number | null;
  readonly integrationStatus: QvaPayAccountIntegrationStatus;
  readonly fetchedAt: string;
}

export function evaluateAccountIntegration(input: {
  readonly balanceOk: boolean;
  readonly identityOk: boolean;
  readonly applicationOk: boolean;
  readonly p2pAccessible: boolean;
}): QvaPayAccountIntegrationStatus {
  const critical = [
    input.balanceOk,
    input.identityOk,
    input.applicationOk,
    input.p2pAccessible,
  ];
  if (critical.every(Boolean)) return "verified";
  if (critical.every((value) => !value)) return "failed";
  return "degraded";
}
