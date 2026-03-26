## ADDED Requirements

### Requirement: GatewayProvider exposes connection to the component tree

A React context provider must wrap the application, create one WebSocket connection to the gateway, and expose connection state, a `send` function, and a `subscribe` function.

#### Scenario: Application mounts and connects

WHEN the app mounts and `NEXT_PUBLIC_GATEWAY_URL` is reachable
THEN the gateway client transitions through `idle → connecting → authenticating → connected`
AND `GatewayContext.status` equals `"connected"` within 5 seconds

#### Scenario: Gateway is unreachable on mount

WHEN the app mounts and the WebSocket URL is not reachable
THEN the gateway client transitions to `status: "error"`
AND the error message is accessible via `GatewayContext.error`

---

### Requirement: Implement challenge/auth handshake

Upon WebSocket open, the server emits a `connect.challenge` event with a `nonce` field. The client must respond with a signed connect request that includes auth context.

#### Scenario: Localhost auto-approval

WHEN connecting from `localhost`
THEN server emits `connect.challenge` with a nonce
AND client replies with a signed connect request that includes `auth.token`
AND server emits `hello` completing the handshake
AND `GatewayContext.status` transitions to `"connected"`

#### Scenario: Stored token reused across page reloads

WHEN `localStorage` contains key `zaloclaw.gateway.token`
THEN the client reads that value and sends it in handshake auth token

#### Scenario: Token received in `hello` is persisted

WHEN the server includes a `token` field in the `hello` event
THEN the client writes it to `localStorage` key `zaloclaw.gateway.token`

#### Scenario: Device credentials persist for next launch

WHEN the client auto-generates or receives `deviceId`, `publicKey`, and `privateKey`
THEN the client stores them in `localStorage`
AND subsequent launches load and reuse these values for handshake

---

### Requirement: `send` issues an RPC request and returns the result

Calling `send(method, params)` must enqueue a JSON-RPC-style message and resolve when the matching response arrives.

#### Scenario: Successful RPC call

WHEN a component calls `send("models.list", {})`
THEN the gateway client sends `{ id, method: "models.list", params: {} }` over the WebSocket
AND resolves the returned Promise with the server's response payload

#### Scenario: RPC call while not connected

WHEN a component calls `send` and `status` is not `"connected"`
THEN the Promise rejects with an error indicating the client is not connected

#### Scenario: RPC error response

WHEN the server responds with `{ id, error: { code, message } }`
THEN the Promise rejects with an object containing `code` and `message`

---

### Requirement: `subscribe` attaches a handler for server-push events

Calling `subscribe(event, handler)` must register a function that is called whenever the server pushes a matching event type.

#### Scenario: Event handler receives payload

WHEN the server pushes an `agent` event
AND a component has subscribed to `"agent"`
THEN the handler is called with the event payload

#### Scenario: Unsubscribe removes the handler

WHEN the unsubscribe function returned by `subscribe` is called
THEN subsequent events of that type do not invoke the removed handler

---

### Requirement: Automatic reconnection with backoff

If the WebSocket closes unexpectedly, the client must attempt to reconnect with exponential backoff.

#### Scenario: Reconnect after unexpected disconnect

WHEN the WebSocket closes with a non-1000 code (unexpected)
THEN the client attempts reconnect after 1 s, then 2 s, then 4 s (max 30 s)
AND each attempt resets `status` to `"connecting"`
AND on successful reconnect the full challenge/auth handshake repeats

#### Scenario: No reconnect on intentional close

WHEN the client calls its own `disconnect()` method
THEN no reconnect attempts are made
