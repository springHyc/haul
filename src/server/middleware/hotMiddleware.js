// @TODO: refactor & clean up

function hotMiddleware(compiler, webSocketProxy, opts = {}) {
  // opts = opts || {};
  // opts.log = typeof opts.log == 'undefined' ? console.log.bind(console) : opts.log;
  // opts.path = opts.path || '/__webpack_hmr';
  // opts.heartbeat = opts.heartbeat || 10 * 1000;

  const eventStream = createEventStream(webSocketProxy, opts.heartbeat);

  compiler.plugin('compile', () => {
    if (opts.log) {
      opts.log('webpack building...');
    }
    eventStream.publish({ action: 'building' });
  });
  compiler.plugin('done', stats => {
    publishStats('built', stats, eventStream, opts.log);
    // Explicitly not passing in `log` fn as we don't want to log again on
    // the server
    // publishStats("sync", stats, eventStream);
  });
}

function createEventStream(webSocketProxy) {
  let webSocket;
  let open = false;
  webSocketProxy.onConnection(socket => {
    console.log('Got HMR connection');
    open = true;
    webSocket = socket;
    webSocket.on('open', () => {
      open = true;
    });
    webSocket.on('close', () => {
      open = false;
    });
  });
  return {
    publish(payload) {
      console.log(webSocket, open);
      if (webSocket && open) {
        webSocket.send(JSON.stringify(payload));
      }
    },
  };
}

function publishStats(action, stats, eventStream, log) {
  // For multi-compiler, stats will be an object with a 'children' array of stats
  const bundles = extractBundles(stats.toJson({ errorDetails: false }));
  bundles.forEach(bundleStats => {
    if (log) {
      // eslint-disable-next-line
      log(
        'webpack built ' +
          (bundleStats.name ? bundleStats.name + ' ' : '') +
          bundleStats.hash +
          ' in ' +
          bundleStats.time +
          'ms',
      );
    }
    eventStream.publish({
      name: bundleStats.name,
      action,
      time: bundleStats.time,
      hash: bundleStats.hash,
      warnings: bundleStats.warnings || [],
      errors: bundleStats.errors || [],
      modules: buildModuleMap(bundleStats.modules),
    });
  });
}

function extractBundles(stats) {
  // Stats has modules, single bundle
  if (stats.modules) return [stats];

  // Stats has children, multiple bundles
  if (stats.children && stats.children.length) return stats.children;

  // Not sure, assume single
  return [stats];
}

function buildModuleMap(modules) {
  const map = {};
  modules.forEach(module => {
    map[module.id] = module.name;
  });
  return map;
}

module.exports = hotMiddleware;
