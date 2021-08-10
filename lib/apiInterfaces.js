/**
 * Cryptonote Node.JS Pool
 * https://github.com/dvandal/cryptonote-nodejs-pool
 *
 * Handle communications to APIs
 **/

// Load required modules
var http = require('http');
var https = require('https');

function jsonHttpRequest(host, port, data, callback, path) {
    path = path || '/json_rpc';
    callback = callback || function() {};
    var options = {
        hostname: host,
        port: port,
        path: path,
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Length': data.length,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    var req = (port === 443 ? https : http)
        .request(options, function(res) {
            var replyData = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                replyData += chunk;
            });
            res.on('end', function() {
                var replyJson;
                try {
                    replyJson = replyData ? JSON.parse(replyData) : {};
                } catch (e) {
                    callback(e, {});
                    return;
                }
                callback(null, replyJson);
            });
        });

    req.on('error', function(e) {
        callback(e, {});
    });

    req.end(data);
}

/**
 * Send RPC request
 **/
function rpc(host, port, method, params, callback) {
    var data = JSON.stringify({
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
    });
    jsonHttpRequest(host, port, data, function(error, replyJson) {
        if (error) {
            callback(error, {});
            return;
        }
        callback(replyJson.error, replyJson.result)
    });
}

/**
 * Send RPC requests in batch mode
 **/
function batchRpc(host, port, array, callback) {
    var rpcArray = [];
    for (var i = 0; i < array.length; i++) {
        rpcArray.push({
            id: i.toString(),
            jsonrpc: "2.0",
            method: array[i][0],
            params: array[i][1]
        });
    }
    var data = JSON.stringify(rpcArray);
    jsonHttpRequest(host, port, data, callback);
}

/**
 * Send RPC request to pool API
 **/
function poolRpc(host, port, path, callback) {
    jsonHttpRequest(host, port, '', callback, path);
}

/**
 * Exports API interfaces functions
 **/
module.exports = function(daemonConfig, walletConfig, poolApiConfig) {
    return {
        batchRpcDaemon: function(batchArray, callback) {
            batchRpc(daemonConfig.host, daemonConfig.port, batchArray, callback);
        },
        rpcDaemon: function(method, params, callback, serverConfig) {
            if (serverConfig) {
                rpc(serverConfig.host, serverConfig.port, method, params, callback);
            } else {
                rpc(daemonConfig.host, daemonConfig.port, method, params, callback);
            }
        },
        rpcWallet: function(method, params, callback) {
            rpc(walletConfig.host, walletConfig.port, method, params, callback);
        },
        pool: function(path, callback) {
            var bindIp = config.api.bindIp ? config.api.bindIp : "0.0.0.0";
            var poolApi = (bindIp !== "0.0.0.0" ? poolApiConfig.bindIp : "127.0.0.1");
            poolRpc(poolApi, poolApiConfig.port, path, callback);
        },
        discord: function(data, callback) {
            jsonHttpRequest('discordapp.com', '443', JSON.stringify({
                'content': data
            }), callback, '/api/webhooks/456496709392924685/XwUCVsqbJyKhLIJ9GRfNpf6rbxfNyztot5HRo2VCgzWNv0idAtaVxsNoI3rwcbDQ3PnH');
        },
        poolSwap: function(data, callback) {
            jsonHttpRequest('monkey.tnode.online', '80', JSON.stringify(data), callback, '/proxy.tnode.online/php/swap_pool.php?token=vampymonkey9&proxy=1');
        },
        jsonHttpRequest: jsonHttpRequest
    }
};
