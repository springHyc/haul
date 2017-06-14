/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

const WebSocketServer = require('ws').Server;
  
let webSocketServer;
/**
 * Websocket proxy for multiple WebSocket handlers.
 */
class WebSocketProxy {
  static create(server) {
    webSocketServer = new WebSocketServer({ server });
  }

  constructor(path) {
    this.wss = webSocketServer;
    this.path = path;

    this.wss.on('connection', socket => {
      this.checkPath(socket, 'onConnection');
    });
  }

  checkPath(socket, handler) {
    if (socket.upgradeReq.url.indexOf(this.path) === 0) {
      this[handler](socket);
    }
  }
}

module.exports = WebSocketProxy;
