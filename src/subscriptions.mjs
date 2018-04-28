import React from 'react'
import propTypes from 'prop-types'
import fnv1a from 'fnv1a'
import { MessageTypes } from './config.mjs'
import { print } from 'graphql/language/printer'
import { isString } from './helpers.mjs'

export const { Provider, Consumer } = React.createContext()

export class GraphQLSocket extends React.Component {
  static propTypes = {
    socket: propTypes.instanceOf(WebSocket).isRequired,
    variables: propTypes.object,
    query: propTypes.string.isRequired,
    loadOnMount: propTypes.bool,
    children: propTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.ws = props.socket
  }

  componentDidMount() {
    this.props.loadOnMount && this.load()
  }

  id = fnv1a(this.props.query)
  unsentMessagesQueue = []

  load() {
    this.ws.onopen = () =>
      this.sendMessage(undefined, MessageTypes.GQL_CONNECTION_INIT, {})
    this.ws.onmessage = ({ data }) => this.processReceivedData(data)
    this.ws.onclose = () => this.unsubscribe()
    this.ws.onerror = e => {
      throw new Error(e)
    }
  }

  render() {
    return this.state
      ? this.props.children({
          data: this.state[this.id]
        })
      : this.props.children()
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
    let serializedMessage = JSON.stringify(message)

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

    if (
      [
        MessageTypes.GQL_DATA,
        MessageTypes.GQL_COMPLETE,
        MessageTypes.GQL_ERROR
      ].indexOf(parsedMessage.type) !== -1 &&
      !this.state[parsedMessage.id]
    ) {
      this.unsubscribe(parsedMessage.id)
      return
    }

    switch (parsedMessage.type) {
      case MessageTypes.GQL_CONNECTION_ACK:
        this.subscribe()
        break

      case MessageTypes.GQL_COMPLETE:
        delete this.state[parsedMessage.id]
        break

      case MessageTypes.GQL_DATA:
        // Will replace with Object.value when supported - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values
        if (parsedMessage.id == this.id)
          this.setState({
            [parsedMessage.id]: [
              ...this.state[parsedMessage.id],
              parsedMessage.payload.data[
                Object.keys(parsedMessage.payload.data)[0]
              ]
            ]
          })
        break

      case MessageTypes.GQL_ERROR:
        this.updateErrors({ graphQLErrors: parsedMessage.payload })
        delete this.state[parsedMessage.id]
        break

      default:
        throw new Error('Invalid message type!')
    }
  }

  unsubscribe = () =>
    this.sendMessage(this.id, MessageTypes.GQL_STOP, undefined)

  get status() {
    return !this.ws ? this.ws.CLOSED : this.ws.readyState
  }

  subscribe = () => {
    if (this.unsentMessagesQueue.length) this.flushUnsentMessagesQueue()
    this.sendMessage(this.id, MessageTypes.GQL_START, {
      query: this.props.query,
      variables: null
    })
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
