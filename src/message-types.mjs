/**
 * The WebSocket Client and server communication messages.
 * @namespace
 * @property {string} GQL_CONNECTION_INIT  Client to server string to initialize connection.
 * @property {string} GQL_CONNECTION_ACK  The server response indicationg the websocket connection has been acknowledged.
 * @property {string} GQL_CONNECTION_ERROR A server connection error response.
 * @property {string} GQL_CONNECTION_KEEP_ALIVE Hearbeat of the ws subscription.
 * @property {string} GQL_CONNECTION_TERMINATE Client request to terminate the WebSocket connection.
 * @property {string} GQL_START Client request to start listening to a GraphQL subscription operation.
 * @property {string} GQL_DATA Server response with data.
 * @property {string} GQL_ERROR Server GraphQL Error response.
 * @property {string} GQL_COMPLETE Server response indicating GraphQL subscription operation is complete.
 * @property {string} GQL_STOP Client request stop listening to a subscription operation.
 */
export const MessageTypes = {
  GQL_CONNECTION_INIT: 'connection_init',
  GQL_CONNECTION_ACK: 'connection_ack',
  GQL_CONNECTION_ERROR: 'connection_error',
  GQL_CONNECTION_KEEP_ALIVE: 'ka',
  GQL_CONNECTION_TERMINATE: 'connection_terminate',
  GQL_START: 'start',
  GQL_DATA: 'data',
  GQL_ERROR: 'error',
  GQL_COMPLETE: 'complete',
  GQL_STOP: 'stop'
}
