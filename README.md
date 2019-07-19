
# No longer maintained

# graphql-react-subscription

A GraphQL subscription client for [graphql-react](https://github.com/jaydenseric/graphql-react).

Inspired by [graphql-subscriptions](https://github.com/apollographql/graphql-subscriptions)

Work in progress!

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

* [GraphQLSocket](#graphqlsocket)
  * [subscribe](#subscribe)
* [Consumer](#consumer)
* [GraphQLSubscribe](#graphqlsubscribe)
* [MessageTypes](#messagetypes)
* [Provider](#provider)
* [Subscribe](#subscribe-1)
* [SubscribeRender](#subscriberender)

### GraphQLSocket

GraphQLSocket manages the websocket connections.

**Parameters**

* `wsTimeout` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** specify the ws timeout duration. (optional, default `Infinity`)
* `websocket` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** [Websocket instance](https://github.com/websockets/ws)

**Examples**

```javascript
import { GraphQLSocket } from 'react-graphql-subscription'

const graphqlSocket = new GraphQLSocket()
```

#### subscribe

Handles subscriptions.

**Parameters**

* `url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The ws url.
* `query` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The GraphQL subscription query.
* `variables` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** query variables.
* `keyId` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** The key Id for the callback listener. (optional, default `0`)
* `callback` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** callback listener.

### Consumer

A React component that gets the [GraphQLSocket](#graphqlsocket) instance from the [React context](https://reactjs.org/docs/context.html) provided by the [Provider](#provider).

**Parameters**

* `children` **ConsumerRender** Render function that receives a [GraphQLSocket](#graphqlsocket) instance.

**Examples**

_Subscribe component makes use of the [GraphQLSocket](#graphqlsocket) instance passed via react context.._

```javascript
import { Consumer } from 'graphql-react'

const Subscribe = props => (
  <Consumer>
    {graphqlSocket => (
      <GraphQLSubscribe graphqlSocket={graphqlSocket} {...props} />
    )}
  </Consumer>
)
```

Returns **ReactElement** React virtual DOM element.

### GraphQLSubscribe

**Extends React.Component**

A React component that requests subscription data.

**Parameters**

* `props` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Component props.
  * `props.graphqlSocket` **[GraphQLSocket](#graphqlsocket)** [GraphQLSocket](#graphqlsocket) instance.
  * `props.query` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GraphQL subscription query.
  * `props.url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Websocket server url.
  * `props.keyId` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** For identical duplicate subscribe components.
  * `props.subscribeOnMount` **bool** should componenet subscribe on mount.
  * `props.children` **RenderQuery** Renders the subscription result.

### MessageTypes

The WebSocket Client and server communication messages.

**Properties**

* `GQL_CONNECTION_INIT` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Client to server string to initialize connection.
* `GQL_CONNECTION_ACK` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The server response indicationg the websocket connection has been acknowledged.
* `GQL_CONNECTION_ERROR` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** A server connection error response.
* `GQL_CONNECTION_KEEP_ALIVE` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Hearbeat of the ws subscription.
* `GQL_CONNECTION_TERMINATE` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Client request to terminate the WebSocket connection.
* `GQL_START` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Client request to start listening to a GraphQL subscription operation.
* `GQL_DATA` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Server response with data.
* `GQL_ERROR` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Server GraphQL Error response.
* `GQL_COMPLETE` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Server response indicating GraphQL subscription operation is complete.
* `GQL_STOP` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Client request stop listening to a subscription operation.

### Provider

A React component provides a [GraphQLSocket](#graphqlsocket) instance via [React context](https://reactjs.org/docs/context.html) for nested [Consumer](#consumer) components to use.

**Parameters**

* `value` **[GraphQLSocket](#graphqlsocket)** A [GraphQLSocket](#graphqlsocket) instance.
* `children` **ReactNode** A React node.

**Examples**

```javascript
import { GraphQLSocket, Provider } from 'graphql-react-subscription'

const graphqlSocket = new GraphQLSocket()

const Page = () => (
  <Provider value={graphqlSocket}>
    Use Consumer or Subscribe components…
  </Provider>
)
```

Returns **ReactElement** React virtual DOM element.

### Subscribe

A React component to manage a GraphQL subscription.

**Parameters**

* `props` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Component props.
  * `props.url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** webocket url.
  * `props.query` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GraphQL subscription query.
  * `props.subscribeOnMount` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** Should the subscription open when the component mounts. (optional, default `false`)
  * `props.keyId` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** Use if there are identical duplicate subscribe components.
  * `props.children` **[SubscribeRender](#subscriberender)** Renders the Subscribe status.

**Examples**

_A subscription to listen for messages._

```javascript
import { Subscribe } from 'graphql-react-subscription'

const Notification = () => (
  <Subscribe
    url={'ws://localhost:3000/subscribe'}
    query={`subscription {
             messages {
                 id
                 from
                 message
             }
         }`}
  >
    {({ subscribe, parseError, data, readyState }) => (
      <>
        {parseError && <strong>Error</strong>}
        <ul>
          {data.forEach(({ id, message, from }) => (
            <li key={id}>
              {from}: {message}
            </li>
          ))}
        </ul>
      </>
    )}
  </Subscribe>
)
```

Returns **ReactElement** React virtual DOM element.

### SubscribeRender

Renders the status of a Subscription.

Type: [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)

**Parameters**

* `subscribe` **[function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Connects a subscription on demand.
* `parseError` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** Parse error message.
* `data` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** GraphQL response data.
* `readyState` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** The ws readyState.

**Examples**

```javascript
;({ subscribe, parseError, data, readyState }) => (
  <aside>
    <button onClick={subscribe}>connect</button>
    {parseError && <strong>Error!</strong>}
    {data && <h1>{data.user.name}</h1>}
  </aside>
)
```

Returns **ReactElement** React virtual DOM element.
