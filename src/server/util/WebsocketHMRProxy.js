/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const WebSocketProxy = require('./WebsocketProxy');

/**
 * Websocket proxy HMR middleware React Native client
 */
class WebSocketHMRProxy extends WebSocketProxy {
  /**
   * Called everytime new WebSocket connection is established.
   */
  onConnection(/* socket */) {
    console.log('got connection');
  }

  
}

module.exports = WebSocketHMRProxy;
