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
  GQL_STOP: 'stop',
  SUBSCRIPTION_START: 'subscription_start',
  SUBSCRIPTION_DATA: 'subscription_data',
  SUBSCRIPTION_SUCCESS: 'subscription_success',
  SUBSCRIPTION_FAIL: 'subscription_fail',
  SUBSCRIPTION_END: 'subscription_end',
  INIT: 'init',
  INIT_SUCCESS: 'init_success',
  INIT_FAIL: 'init_fail',
  KEEP_ALIVE: 'keepalive'
}

export const WS_TIMEOUT = 30000
