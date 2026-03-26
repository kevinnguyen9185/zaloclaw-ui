export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "authenticating"
  | "connected"
  | "error";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export interface RpcRequest<TParams extends JsonValue = JsonValue> {
  type: "rpc";
  id: number;
  method: string;
  params: TParams;
}

export interface RpcError {
  code: number;
  message: string;
  data?: JsonValue;
}

export interface RpcResponse<TResult extends JsonValue = JsonValue> {
  type: "rpc-response";
  id: number;
  result?: TResult;
  error?: RpcError;
}

export interface GatewayEvent<TPayload extends JsonValue = JsonValue> {
  type: "event";
  event: string;
  payload?: TPayload;
  [key: string]: JsonValue | undefined;
}

export interface ConnectChallengeEvent {
  type: "event";
  event: "connect.challenge";
  payload: {
    nonce: string;
    ts: number;
  };
}

export interface HelloEvent {
  type: "event";
  event: "hello";
  token?: string;
}

export interface ConnectParamsMessage {
  type: "event";
  event: "connect.params";
  payload: {
    auth: {
      token: string;
    };
  };
}
