/* global __resourceQuery __webpack_public_path__ */

// @TODO: refactor & cleanup
// @TODO: whitelist for transpilation by babel

const options = {
  path: '/__webpack_hmr',
  timeout: 20 * 1000,
  overlay: true,
  reload: false,
  log: true,
  warn: true,
  name: '',
};
if (__resourceQuery) {
  const querystring = require('querystring');
  const overrides = querystring.parse(__resourceQuery.slice(1));
  if (overrides.path) options.path = overrides.path;
  if (overrides.timeout) options.timeout = overrides.timeout;
  if (overrides.overlay) options.overlay = overrides.overlay !== 'false';
  if (overrides.reload) options.reload = overrides.reload !== 'false';
  if (overrides.noInfo && overrides.noInfo !== 'false') {
    options.log = false;
  }
  if (overrides.name) {
    options.name = overrides.name;
  }
  if (overrides.quiet && overrides.quiet !== 'false') {
    options.log = false;
    options.warn = false;
  }
  if (overrides.dynamicPublicPath) {
    // eslint-disable-next-line
    options.path = __webpack_public_path__ + options.path;
  }
}

connect();

// /*
// function EventSourceWrapper() {
//   var source;
//   var lastActivity = new Date();
//   var listeners = [];

//   init();
//   var timer = setInterval(function() {
//     if ((new Date() - lastActivity) > options.timeout) {
//       handleDisconnect();
//     }
//   }, options.timeout / 2);

//   function init() {
//     source = new window.EventSource(options.path);
//     source.onopen = handleOnline;
//     source.onerror = handleDisconnect;
//     source.onmessage = handleMessage;
//   }

//   function handleOnline() {
//     if (options.log) console.log("[HMR] connected");
//     lastActivity = new Date();
//   }

//   function handleMessage(event) {
//     lastActivity = new Date();
//     for (var i = 0; i < listeners.length; i++) {
//       listeners[i](event);
//     }
//   }

//   function handleDisconnect() {
//     clearInterval(timer);
//     source.close();
//     setTimeout(init, options.timeout);
//   }

//   return {
//     addMessageListener: function(fn) {
//       listeners.push(fn);
//     }
//   };
// }

// function getEventSourceWrapper() {
//   if (!window.__whmEventSourceWrapper) {
//     window.__whmEventSourceWrapper = {};
//   }
//   if (!window.__whmEventSourceWrapper[options.path]) {
//     // cache the wrapper for other entries loaded on
//     // the same page with the same options.path
//     window.__whmEventSourceWrapper[options.path] = EventSourceWrapper();
//   }
//   return window.__whmEventSourceWrapper[options.path];
// }*/

function connect() {
  // eslint-disable-next-line
  const ws = new WebSocket(options.path);
  ws.onopen = function() {
    console.log('HMR client connected');
  };
  ws.onerror = function(error) {
    console.error(
      `HMR client could not connect to the server ${options.path}`,
      error,
    );
  };
  ws.onmessage = handleMessage;

  function handleMessage(message) {
    console.log(message);
    const payload = JSON.parse(message.data);
    try {
      processMessage(payload);
    } catch (error) {
      if (options.warn) {
        console.warn(`Invalid HMR message: ${message}`, error);
      }
    }
  }
}

let reporter;
// // the reporter needs to be a singleton on the page
// // in case the client is being used by multiple bundles
// // we only want to report once.
// // all the errors will go to all clients
// /*
// const singletonKey = '__webpack_hot_middleware_reporter__';

// if (typeof window !== 'undefined') {
//   if (!window[singletonKey]) {
//     window[singletonKey] = createReporter();
//   }
//   reporter = window[singletonKey];
// }

// function createReporter() {
//   var strip = require('strip-ansi');

//   var overlay;
//   if (typeof document !== 'undefined' && options.overlay) {
//     overlay = require('./client-overlay');
//   }

//   var styles = {
//     errors: "color: #ff0000;",
//     warnings: "color: #999933;"
//   };
//   var previousProblems = null;
//   function log(type, obj) {
//     var newProblems = obj[type].map(function(msg) { return strip(msg); }).join('\n');
//     if (previousProblems == newProblems) {
//       return;
//     } else {
//       previousProblems = newProblems;
//     }

//     var style = styles[type];
//     var name = obj.name ? "'" + obj.name + "' " : "";
//     var title = "[HMR] bundle " + name + "has " + obj[type].length + " " + type;
//     // NOTE: console.warn or console.error will print the stack trace
//     // which isn't helpful here, so using console.log to escape it.
//     if (console.group && console.groupEnd) {
//       console.group("%c" + title, style);
//       console.log("%c" + newProblems, style);
//       console.groupEnd();
//     } else {
//       console.log(
//         "%c" + title + "\n\t%c" + newProblems.replace(/\n/g, "\n\t"),
//         style + "font-weight: bold;",
//         style + "font-weight: normal;"
//       );
//     }
//   }

//   return {
//     cleanProblemsCache: function () {
//       previousProblems = null;
//     },
//     problems: function(type, obj) {
//       if (options.warn) {
//         log(type, obj);
//       }
//       if (overlay && type !== 'warnings') overlay.showProblems(type, obj[type]);
//     },
//     success: function() {
//       if (overlay) overlay.clear();
//     },
//     useCustomOverlay: function(customOverlay) {
//       overlay = customOverlay;
//     }
//   };
// }*/

const processUpdate = require('webpack-hot-middleware/process-update');

let customHandler;
let subscribeAllHandler;
function processMessage(payload) {
  switch (payload.action) {
    case 'building':
      if (options.log) {
        console.log(
          `[HMR] bundle ${payload.name ? `'${payload.name}' ` : ''}rebuilding`,
        );
      }
      break;
    case 'built':
      if (options.log) {
        console.log(
          `[HMR] bundle ${payload.name ? `'${payload.name}' ` : ''}rebuilt in ${payload.time}ms`,
        );
      }
    // fall through
    case 'sync':
      if (payload.name && options.name && payload.name !== options.name) {
        return;
      }
      if (payload.errors.length > 0) {
        if (reporter) reporter.problems('errors', payload);
      } else {
        if (reporter) {
          if (payload.warnings.length > 0) {
            reporter.problems('warnings', payload);
          } else {
            reporter.cleanProblemsCache();
          }
          reporter.success();
        }
        processUpdate(payload.hash, payload.modules, options);
      }
      break;
    default:
      if (customHandler) {
        customHandler(payload);
      }
  }

  if (subscribeAllHandler) {
    subscribeAllHandler(payload);
  }
}

if (module) {
  module.exports = {
    subscribeAll: function subscribeAll(handler) {
      subscribeAllHandler = handler;
    },
    subscribe: function subscribe(handler) {
      customHandler = handler;
    },
    useCustomOverlay: function useCustomOverlay(customOverlay) {
      if (reporter) reporter.useCustomOverlay(customOverlay);
    },
  };
}
