export type QvaPayP2POfferStatus =
  "open" | "revision" | "processing" | "paid" | "completed" | "cancelled";

export interface QvaPayP2PUserDto {
  readonly username?: string;
  readonly name?: string;
  readonly vip?: boolean;
}

export interface QvaPayP2POfferDto {
  readonly uuid: string;
  readonly type: "buy" | "sell";
  readonly coin: string;
  readonly amount: string;
  readonly receive: string;
  readonly available_amount: string;
  readonly status?: QvaPayP2POfferStatus;
  readonly reserved_amount?: string;
  readonly order_min?: string;
  readonly order_max?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly only_vip?: boolean;
  readonly User?: QvaPayP2PUserDto;
}

export interface QvaPayP2PPageDto {
  readonly data: readonly QvaPayP2POfferDto[];
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
}
