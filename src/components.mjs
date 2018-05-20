import React from 'react'
import propTypes from 'prop-types'
import { GraphQLSocket } from './graphql-socket.mjs'

const ssr = typeof window === 'undefined'

export const {
  /**
   * A React component provides a {@link GraphQLSocket} instance in context for nested
   * {@link Consumer} components to use.
   * @function
   * @param {GraphQLSocket} value A {@link GraphQLSocket} instance.
   * @param {ReactNode} children A React node.
   * @returns {ReactElement} React virtual DOM element.
   * @example
   * import { GraphQLSocket, Provider } from 'graphql-react-subscription'
   *
   * const graphqlSocket = new GraphQLSocket()
   *
   * const Page = () => (
   *   <Provider value={graphqlSocket}>Use Consumer or Subscribe components…</Provider>
   * )
   */
  Provider,

  /**
   * A React component that gets the {@link GraphQLSocket} instance from context.
   * @function
   * @param {ConsumerRender} children Render function that receives a {@link GraphQLSocket} instance.
   * @returns {ReactElement} React virtual DOM element.
   * @example <caption>A button component that resets the {@link GraphQL#cache GraphQL cache}.</caption>
   * import { Consumer } from 'graphql-react'
   *
   * const ResetSubscriptionsButton = () => (
   *   <Consumer>
   *     {graphqlSocket => <button onClick={graphqlSocket.reset}>Reset cache</button>}
   *   </Consumer>
   * )
   */
  Consumer
} = React.createContext()

/**
 * A React component that requests subscription data.
 * @class
 * @param {object} props Component props.
 * @param {GraphQLSocket} props.graphqlSocket {@link GraphQLSocket} instance.
 * @param {string} props.query GraphQL subscription query.
 * @param {string} props.url Websocket server url.
 * @param {number} [props.keyId] For identical duplicate subscribe components.
 * @param {bool} props.subscribeOnMount should componenet subscribe on mount.
 * @param {RenderQuery} props.children Renders the subscription result.
 */
export class GraphQLSubscribe extends React.Component {
  static propTypes = {
    query: propTypes.string.isRequired,
    url: propTypes.string.isRequired,
    children: propTypes.func.isRequired,
    subscribeOnMount: propTypes.bool,
    graphqlSocket: propTypes.instanceOf(GraphQLSocket).isRequired,
    keyId: propTypes.number
  }

  constructor(props) {
    super(props)
    Object.assign(this, ...props)
    this.graphqlSocket = props.graphqlSocket
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  /**
   * Handles {@link RequestCache request cache} updates.
   * @protected
   * @param {RequestCache} requestCache Request cache.
   * @override
   */
  handleUpdateRequestCache = requestCache => this.setState({ ...requestCache })

  componentDidMount() {
    !ssr &&
      this.subscribeOnMount &&
      this.graphqlSocket.subscribe(
        this.url,
        this.query,
        this.variables,
        this.keyId,
        this.handleUpdateRequestCache
      )
  }

  unsubscribe = () =>
    this.graphqlSocket.unsubscribe(
      this.url,
      this.query,
      this.variables,
      this.keyId
    )

  render() {
    return this.props.children({
      ...this.state
    })
  }
}

/**
 * A React component to manage a GraphQL subscription.
 * @param {object} props Component props.
 * @param {string} props.url webocket url.
 * @param {string} props.query GraphQL subscription query.
 * @param {boolean} [props.subscribeOnMount=false] Should the subscription open when the component mounts.
 * @param {number} [keyId] Use if there are identical duplicate subscribe components.
 * @param {SubscribeRender} props.children Renders the Subscribe status.
 * @returns {ReactElement} React virtual DOM element.
 * @example <caption>A subscription to listen for messages.</caption>
 * import { Subscribe } from 'graphql-react-subscription'
 *
 * const Notification = () => (
 *  <Subscribe
 *      url={'ws://localhost:3000/subscribe'}
 *      query={
 *          `subscription {
 *              messages {
 *                  id
 *                  from
 *                  message
 *              }
 *          }`
 *      }>
 *      {({ subscribe, parseError, graphQLErrors, data }) => (
 *          <>
 *            {(parseError || graphQLErrors) && <strong>Error</strong>}
 *            <ul>
 *                {
 *                  data.forEach(({ id, message, from }) =>
 *                    <li key={id}>{from}: {message}</li>
 *                  )
 *                }
 *            </ul>
 *          </>
 *      )}
 *  </Subscribe>
 * )
 */
export const Subscribe = props => (
  <Consumer>
    {graphqlSocket => (
      <GraphQLSubscribe graphqlSocket={graphqlSocket} {...props} />
    )}
  </Consumer>
)

Subscribe.propTypes = {
  query: propTypes.string.isRequired,
  url: propTypes.string.isRequired,
  children: propTypes.func.isRequired,
  subscribeOnMount: propTypes.bool,
  keyId: propTypes.number
}

/**
 * Renders the status of a Subscription.
 * @typedef {function} SubscribeRender
 * @param {function} subscribe Connects a subscription on demand.
 * @param {string} [parseError] Parse error message.
 * @param {object} [graphQLErrors] GraphQL response errors.
 * @param {object} [data] GraphQL response data.
 * @returns {ReactElement} React virtual DOM element.
 * @example
 * ({ subscribe, parseError, graphQLErrors, data }) => (
 *   <aside>
 *     <button onClick={subscribe}>connect</button>
 *     {(parseError || graphQLErrors) && <strong>Error!</strong>}
 *     {data && <h1>{data.user.name}</h1>}
 *   </aside>
 * )
 */