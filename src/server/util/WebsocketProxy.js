/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

/**
 * Proxy connection from single WebSockerServer by given path.
 */
function webSocketProxy(webSocketServer, path) {
  return {
    onConnection(handler) {
      webSocketServer.on('connection', socket => {
        if (socket.upgradeReq.url.indexOf(path) === 0) {
          handler(socket);
        }
      });
    },
  };
}

module.exports = webSocketProxy;
