export interface QvaPayP2PUserDto {\n  readonly username?: string;\n  readonly name?: string;\n}\n\nexport interface QvaPayP2POfferDto {
  readonly uuid: string;
  readonly type: "buy" | "sell";
  readonly coin: string;
  readonly amount: string;
  readonly receive: string;
  readonly available_amount: string;
  readonly reserved_amount?: string;
  readonly order_min?: string;
  readonly order_max?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface QvaPayP2PPageDto {
  readonly data: readonly QvaPayP2POfferDto[];
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
}
