import { isString, _global } from './helpers'
import fnv1a from 'fnv1a'
import { MessageTypes } from './message-types'

/*eslint-disable */
/**
 * GraphQLSocket manages the websocket connections.
 * @param {number} [wsTimeout] specify the ws timeout duration.
 * @param {Object} [websocket] {@link https://github.com/websockets/ws Websocket instance}
 * @example
 * import { GraphQLSocket } from 'react-graphql-subscription'
 *
 * const graphqlSocket = new GraphQLSocket()
 */
/*eslint-enable */
export class GraphQLSocket {
  constructor(wsTimeout = Infinity, websocket) {
    this.ws = websocket || _global.WebSocket || _global.MozWebSocket
    this.wsTimeout = wsTimeout
  }

  connections = {}
  cache = {}
  wsTimeoutTimer = {}

  /**
   * Handles subscriptions.
   * @param {string} url The ws url.
   * @param {string} query The GraphQL subscription query.
   * @param {string} variables query variables.
   * @param {number} keyId The key Id for the callback listener.
   * @param {function} callback callback listener.
   */
  subscribe = (url, query, variables, keyId = 0, callback) => {
    const hashedURL = fnv1a(url)
    const queryId = fnv1a(query + variables + keyId)

    if (!this.connections[hashedURL])
      this.connections[hashedURL] = new this.ws(url, 'graphql-ws')

    this.cache[hashedURL] = {
      ...this.cache[hashedURL],
      [queryId]: {
        query,
        variables,
        callback
      }
    }

    const ws = this.connections[hashedURL]

    ws.onopen = ({ currentTarget: { url } }) =>
      this.sendMessage(
        undefined,
        MessageTypes.GQL_CONNECTION_INIT,
        {},
        this.connections[fnv1a(url)]
      )

    ws.onmessage = ({ data, currentTarget: { url } }) =>
      this.processData(data, fnv1a(url))

    ws.onerror = ({ currentTarget: { url, readyState } }) => {
      Object.values(this.cache[fnv1a(url)]).forEach(({ callback }) =>
        callback({ parseError: 'Server is not responding', readyState })
      )
    }

    ws.onclose = ({ currentTarget: { url, readyState } }) => {
      Object.values(this.cache[fnv1a(url)]).forEach(({ callback }) =>
        callback({
          data: 'Websocket has closed.',
          readyState
        })
      )

      delete this.connections[fnv1a(url)]
      delete this.cache[fnv1a(url)]
    }
  }

  unsubscribe = (url, query, variables, keyId = 0) => {
    const hashedURL = fnv1a(url)
    const queryId = fnv1a(query + variables + keyId)

    this.sendMessage(
      queryId,
      MessageTypes.GQL_STOP,
      {},
      this.connections[hashedURL]
    )
  }

  handleKeepAlive = id =>
    (this.wsTimeoutTimer[id] = setTimeout(
      () => this.connections[id].close(),
      this.wsTimeout
    ))

  refreshKeepAlive = id => {
    clearTimeout(this.wsTimeoutTimer[id])
    this.handleKeepAlive(id)
  }

  processData = (data, wsId) => {
    let parsedData
    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      return Error(e)
    }

    switch (parsedData.type) {
      case MessageTypes.GQL_CONNECTION_ACK:
        Object.values(this.cache[wsId]).forEach(({ query, variables }, i) =>
          this.sendMessage(
            Object.keys(this.cache[wsId])[i],
            MessageTypes.GQL_START,
            { query, variables },
            this.connections[wsId]
          )
        )
        break

      case MessageTypes.GQL_DATA:
        this.cache[wsId][parsedData.id].callback(parsedData.payload)
        break

      case MessageTypes.GQL_ERROR:
        this.cache[wsId][parsedData.id].callback(parsedData.payload)
        break

      case MessageTypes.GQL_COMPLETE:
        delete this.cache[wsId][parsedData.id]
        if (!Object.values(this.cache[wsId]).length)
          this.sendMessage(
            wsId,
            MessageTypes.GQL_CONNECTION_TERMINATE,
            {},
            this.connections[wsId]
          )
        break
      case MessageTypes.GQL_CONNECTION_KEEP_ALIVE:
        if (this.wsTimeout !== Infinity) {
          this.handleKeepAlive(wsId)
          this.sendMessage(
            wsId,
            MessageTypes.GQL_CONNECTION_KEEP_ALIVE,
            {},
            this.connections[wsId]
          )
        }
        break
    }
  }

  /**
   * Creates an opperation Id.
   * @private
   * @function
   * @param {string} url Websocket url.
   * @param {string} query Graphql subscription string.
   * @param {string} [subId] GraphQL Subscription ID.
   * @returns {OpperationId} opperation id string.
   */
  createOpId = (url, query, subId = null) =>
    subId
      ? `${fnv1a(url)}.${fnv1a(query)}.${subId}`
      : `${fnv1a(url)}.${fnv1a(query)}`

  sendMessage = (opId, type, payload, ws) =>
    this.sendRawMessage(this.buildMessage(opId, type, payload), ws)

  /**
   * This factory function builds a {@link MessageObject}.
   * @private
   * @function
   * @param {OpperationId} [id] Opperation ID for GraphQL Subscription.
   * @param {string} type GraphQL-React-Subscription {@link MessageType}.
   * @param {Object} [payload] The subscription payload.
   * @param {string} [payload.query] The subscription query string
   * @param {string} [payload.variables] The subscription arguments.
   * @returns {MessageObject} Built message object.
   */
  buildMessage = (id, type, payload) => {
    return {
      id,
      type,
      payload:
        payload && payload.query
          ? {
              ...payload,
              query: isString(payload.query)
                ? payload.query
                : print(payload.query)
            }
          : payload
    }
  }

  /**
   * Checks ws status, before serializing and sending the message via ws.
   * @private
   * @param {MessageObject} message Message object to send.
   * @param {WebSocket} ws websocket instance {@link https://github.com/websockets/ws WebSocket }
   */
  sendRawMessage = (message, ws) => {
    const serializedMessage = JSON.stringify(message)
    switch (!ws ? ws.CLOSED : ws.readyState) {
      case ws.OPEN:
        ws.send(serializedMessage)
        break
      case ws.CONNECTING:
        this.unsentMessagesQueue.push(message)
        break
      default:
        throw new Error(
          `Socket is not connected, is closing or is already closed. The message "${JSON.stringify(
            message
          )}" was not sent!`
        )
    }
  }
}

/**
 * The opperation ID consists of three parts, delimited by a dot separator.
 * @private
 * 1. {@link WebSocketId}
 * 2. {@link QueryId}
 * 3. {@link SubscriptionId}
 * @typedef {string} OpperationId
 * @example
 * `${fnv1a(ws://localhost:3000/subscribe).fnv1a('subscription{notification{id}}').keyId.5af92aeaa40e8f4120d052ea}`
 */

/**
 * fnv1a hash of the WebSocket url.
 * @private
 * @typedef {string} WebSocketId
 * fnv1a('ws://localhost:3000/subscribe')
 */

/**
 * fnv1a hash of the graphql subscription query.
 * @private
 * @typedef {string} QueryId
 * @example
 * fnv1a('subscribe{notifications}')
 */

/**
 * A GraphQL subscription ID.
 * @private
 * @typedef {string} SubscriptionId
 * @example
 * 5af92aeaa40e8f4120d052ea
 */

/**
 * @private
 * @typedef {Object} MessageObject
 * @type {OpperationId}
 * @type {MessageType}
 * @type {payload}
 */
