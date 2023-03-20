module.exports = function(RED) {
    function BloggingAppNode(config) {
      RED.nodes.createNode(this, config);
      var node = this;
  
      // Initialize the list of messages
      var messageList = [];
  
      // Function to filter messages by sender name
      function filterMessagesBySender(messages, sender) {
        return messages.filter(function(message) {
          return message.sender === sender;
        });
      }
  
      // Create a HTTP endpoint to receive new messages
      RED.httpNode.post("/blogging-app/messages", function(req, res) {
        var newMessage = {
          sender: req.body.sender,
          content: req.body.content
        };
        messageList.push(newMessage);
        var responseMessageList = messageList.map(function(message) {
          return message.sender + ": " + message.content;
        });
        res.json(responseMessageList);
      });
  
      // Create a HTTP endpoint to get all messages
      RED.httpNode.get("/blogging-app/messages", function(req, res) {
        res.json(messageList);
      });
  
      // Create a HTTP endpoint to get messages filtered by sender name
      RED.httpNode.get("/blogging-app/messages/:sender", function(req, res) {
        var filteredMessageList = filterMessagesBySender(messageList, req.params.sender);
        var responseMessageList = filteredMessageList.map(function(message) {
          return message.sender + ": " + message.content;
        });
        res.json(responseMessageList);
      });
  
      // Create a Node-RED flow for translating messages
      var translateMessagesFlow = [
        {
          id: "translate-messages-node",
          type: "translate-messages",
          wires: [["output-node"]]
        },
        {
          id: "output-node",
          type: "debug"
        }
      ];
      RED.nodes.addFlow(translateMessagesFlow);
  
      // Create a HTTP endpoint to get the Node-RED flow for translating messages
      RED.httpNode.get("/blogging-app/translate-messages-flow", function(req, res) {
        res.json(translateMessagesFlow);
      });
    }
    RED.nodes.registerType("blogging-app", BloggingAppNode);
  };