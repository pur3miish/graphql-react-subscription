import React from 'react'
import propTypes from 'prop-types'
import fnv1a from 'fnv1a'
import { MessageTypes } from './config.mjs'
import { print } from 'graphql/language/printer'
import { isString, _global, ssr } from './helpers.mjs'
import Backoff from 'backo2'

export const { Provider, Consumer } = React.createContext()

export class WebSocketProvider extends React.Component {
  static propTypes = {
    url: propTypes.string.isRequired,
    children: propTypes.object.isRequired,
    websocket: propTypes.object
  }

  handleReconnect = () => {}

  constructor(props) {
    super(props)
    this.url = props.url
    if (!this.url) throw new Error('Provide a websocket url.')

    this.websocket = props.websocket

    if (!ssr) {
      this.socket = this.websocket || _global.WebSocket || _global.MozWebSocket
      if (!this.socket)
        throw new Error(
          'No native websocket available, please pass your custom websocket implimentation as websocket prop.'
        )
      this.connect()
    }
  }

  backoff = new Backoff({ jitter: 0.5 })
  reconnecting = false

  connect() {
    this.client = new this.socket(this.url, 'graphql-ws')
  }

  componentWillUnmount() {
    this.client.send('{"type":"connection_terminate","payload":null}')
  }

  render() {
    return <Provider value={this.client}>{this.props.children}</Provider>
  }

  tryReconnect() {
    if (this.reconnecting)
      setTimeout(() => this.load(), this.backoff.duration())
  }
}

export class GraphQLSocket extends React.Component {
  static propTypes = {
    socket: propTypes.object.isRequired,
    variables: propTypes.object,
    query: propTypes.string.isRequired,
    loadOnMount: propTypes.bool,
    children: propTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.ws = props.socket
  }

  get status() {
    return !this.ws ? this.ws.CLOSED : this.ws.readyState
  }

  componentDidMount() {
    this.props.loadOnMount && this.load()
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  id = fnv1a(this.props.query)
  unsentMessagesQueue = []

  load() {
    this.ws.onopen = () => {
      this.sendMessage(undefined, MessageTypes.GQL_CONNECTION_INIT, {})
    }
    this.ws.onmessage = ({ data }) => this.processReceivedData(data)

    this.ws.onerror = e => {
      throw new Error(e)
    }
  }

  sendMessage = (id, type, payload) =>
    this.preFlightMsgCheck(this.buildMessage(id, type, payload))

  buildMessage = (id, type, payload) => ({
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
  })

  /**
   * Checks Status of socket and validates message.
   * @param {Object} message - graphql message to send.
   */
  preFlightMsgCheck(message) {
    const serializedMessage = JSON.stringify(message)
    switch (this.status) {
      case this.ws.OPEN:
        try {
          JSON.parse(serializedMessage)
        } catch (e) {
          throw new Error(`Message must be JSON-serializable. Got: ${message}`)
        }

        this.ws.send(serializedMessage)
        if (message.type == MessageTypes.GQL_START)
          this.setState({ [this.id]: [] })
        break

      case this.ws.CONNECTING:
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

  flushUnsentMessagesQueue() {
    this.unsentMessagesQueue.forEach(message => this.preFlightMsgCheck(message))
    this.unsentMessagesQueue = []
  }

  processReceivedData(receivedData) {
    let parsedMessage

    try {
      parsedMessage = JSON.parse(receivedData)
      JSON.stringify(parsedMessage)
    } catch (e) {
      throw new Error(`Message must be JSON-parseable. Got: ${receivedData}`)
    }

    switch (parsedMessage.type) {
      case MessageTypes.GQL_CONNECTION_ACK:
        this.subscribe()
        break
      case MessageTypes.GQL_COMPLETE:
        this.setState({})
        this.id = null
        break
      case MessageTypes.GQL_DATA:
        if (parsedMessage.id == this.id)
          this.setState({
            [parsedMessage.id]: [
              ...this.state[parsedMessage.id],
              ...Object.values(parsedMessage.payload.data)
            ]
          })
        break
      case MessageTypes.GQL_ERROR:
        this.setState({ [this.id]: ['An unknown error has occured.'] })
        break

      case MessageTypes.GQL_CONNECTION_KEEP_ALIVE:
        break

      default:
        throw new Error('Invalid message type!')
    }
  }

  unsubscribe = () => {
    if (this.ws !== null)
      this.sendMessage(this.id, MessageTypes.GQL_STOP, undefined)
  }

  subscribe = () => {
    if (this.unsentMessagesQueue.length) this.flushUnsentMessagesQueue()
    this.sendMessage(this.id, MessageTypes.GQL_START, {
      query: this.props.query,
      variables: null
    })
  }

  render() {
    return this.state
      ? this.props.children({
          data: this.state[this.id],
          close: this.subscribe
        })
      : this.props.children()
  }
}

export const Subscribe = props => (
  <Consumer>{socket => <GraphQLSocket socket={socket} {...props} />}</Consumer>
)

Subscribe.propTypes = {
  variables: propTypes.object,
  query: propTypes.string.isRequired,
  loadOnMount: propTypes.bool,
  children: propTypes.func.isRequired
}
