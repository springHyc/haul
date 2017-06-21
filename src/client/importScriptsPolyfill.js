// @TODO: refactor
// @TODO: whitelist for transpilation by babel

global.importScripts = global.importScripts ||
  function(importPath) {
    const timeout = 10000;
    if (typeof XMLHttpRequest === 'undefined') {
      throw new Error('No XMLHttpRequest support');
    }

    // eslint-disable-next-line
    const request = new XMLHttpRequest();
    request.timeout = timeout;
    request.onreadystatechange = function() {
      if (request.readyState !== 4) return;
      if (request.status === 0) {
        // timeout
        throw new Error(`Request for ${importPath} timed out`);
      } else if (request.status === 404) {
        throw new Error(`Resource ${importPath} was not found on server`);
      } else if (request.status !== 200 && request.status !== 304) {
        // other failure
        throw new Error(`Request for  ${importPath} failed`);
      } else {
        // success
        // eslint-disable-next-line
        eval(request.responseText);
      }
    };
    try {
      request.open('GET', importPath);
    } catch (e) {
      // noop
    }
    request.send(null);
  };
