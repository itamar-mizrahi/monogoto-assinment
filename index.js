// Load the Node-RED runtime
var http = require("http");
var RED = require("node-red");

// Create a Node-RED server
var server = http.createServer(function(req,res) {
    // Serve the editor or admin UI
    // See https://nodered.org/docs/configuration#http-static for more information
});

// Create the settings object
var settings = {
    httpAdminRoot:"/admin",
    httpNodeRoot: "/api",
    userDir: "/path/to/user/directory",
    flowFile: "flows.json"
};

// Initialize Node-RED with the settings object
RED.init(server,settings);

// Load custom nodes here
require("./nodes/my-node/my-node.js")(RED);

// Start the Node-RED server
RED.start();