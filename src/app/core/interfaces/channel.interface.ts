export interface ChannelResponse {
  description: string | null;
  id: string | null;
  identifier: string | null;
  organizationId: string | null;
  type: number;
}

export interface ApiErrorResponse {
  errorCode: string | null;
  msg: string | null;
  status: string | null;
}
