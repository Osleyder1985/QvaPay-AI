/**
 * @archivo src/infrastructure/qvapay/account-contract.ts
 * @proposito Define el contrato interno de integración de cuenta QvaPay.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/qvapay dentro de la arquitectura de QvaPay-AI.
 */

export interface QvaPayAccountUser {
  readonly uuid: string;
  readonly username: string;
  readonly name: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
  readonly bio: string | null;
  readonly balance: number | null;
  readonly satoshis: number | null;
  readonly phone: string | null;
  readonly phoneVerified: boolean | null;
  readonly kyc: boolean | null;
  readonly goldenCheck: boolean | null;
  readonly goldenExpire: string | null;
  readonly p2pEnabled: boolean | null;
  readonly savingsRoundup: boolean | null;
  readonly cover: string | null;
  readonly image: string | null;
  readonly twitter: string | null;
  readonly telegram: string | null;
  readonly twoFactorEnabled: boolean | null;
  readonly ratingAvg: number | null;
  readonly ratingCount: number | null;
  readonly vip: boolean | null;
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
export type QvaPayAccountDataStatus =
  "verified" | "unavailable" | "degraded" | "failed";

export interface QvaPayAccountSourceMetadata {
  readonly endpoint: string;
  readonly retrievedAt: string | null;
  readonly httpStatus: number;
  readonly status: QvaPayAccountDataStatus;
  readonly error: string | null;
}

export interface QvaPayAccountSnapshot {
  readonly balanceUsd: number | null;
  readonly balanceSource: QvaPayAccountSourceMetadata;
  readonly balanceHttpStatus: number;
  readonly balanceOk: boolean;
  readonly balanceError: string | null;
  readonly identity: QvaPayAccountUser | null;
  readonly identityProvenance: QvaPayAccountSourceMetadata;
  readonly identitySource: "/user";
  readonly identityHttpStatus: number;
  readonly identityOk: boolean;
  readonly identityError: string | null;
  readonly application: QvaPayApplicationIdentity | null;
  readonly applicationProvenance: QvaPayAccountSourceMetadata;
  readonly applicationHttpStatus: number;
  readonly applicationOk: boolean;
  readonly p2pAccessible: boolean;
  readonly ownOffersTotal: number | null;
  readonly ownOffersProvenance: QvaPayAccountSourceMetadata;
  readonly integrationStatus: QvaPayAccountIntegrationStatus;
  readonly fetchedAt: string;
}

/**
 * @proposito API pública evaluateAccountIntegration: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 * @returns Resultado de la operación pública.
 */
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
