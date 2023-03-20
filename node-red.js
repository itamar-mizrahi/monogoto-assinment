module.exports = function(RED) {
    const request = require('request');
    const querystring = require('querystring');
    
    // Blogging app node constructor
    function BloggingAppNode(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        const messages = [];
        
        // function to update the dashboard with the latest messages
        function updateDashboard() {
            const filteredMessages = config.senderFilter ? messages.filter(msg => msg.sender === config.senderFilter) : messages;
            const translatedMessages = config.translation ? translateMessages(filteredMessages, config.translation) : filteredMessages;
            const messageList = translatedMessages.map(msg => msg.sender + ': ' + msg.content).join('\n');
            node.send([{payload: messageList}, {payload: messages}]);
        }
        
        // function to translate messages to the specified language
        function translateMessages(messages, targetLang) {
            return new Promise((resolve, reject) => {
                const baseUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&q=';
                const translations = [];
                messages.forEach((message, index) => {
                    const query = message.content.replace(/ /g, '+');
                    const url = baseUrl + querystring.escape(query) + '&sl=' + sourceLang + '&tl=' + targetLang;
                    request(url, (error, response, body) => {
                        if (error) {
                            reject(error);
                        } else if (response.statusCode !== 200) {
                            reject(new Error('Unexpected status code: ' + response.statusCode));
                        } else {
                            const translation = JSON.parse(body)[0][0][0];
                            translations[index] = Object.assign({}, message, {content: translation});
                            if (translations.length === messages.length) {
                                resolve(translations);
                            }
                        }
                    });
                });
            });
        }
        
        // handle incoming messages to add them to the list
        node.on('input', function(msg) {
            const message = {content: msg.payload.content, sender: msg.payload.sender};
            messages.push(message);
            updateDashboard();
        });
        
        // update the dashboard when the sender filter or translation changes
        node.on('close', function() {
            RED.httpNode.get('/blogging-app/' + node.id, function(req, res) {
                config.senderFilter = req.query.sender || '';
                config.translation = req.query.translate || '';
                updateDashboard();
            });
        });
    }
    RED.nodes.registerType("blogging-app", BloggingAppNode);
    
    // dashboard UI configuration
    RED.httpNode.get('/blogging-app/:id', RED.auth.needsPermission('blogging-app.read'), function(req, res) {
        const node = RED.nodes.getNode(req.params.id);
        const form = '<form><label for="sender">Filter by sender:</label> <input type="text" id="sender" name="sender" value="' + node.config.senderFilter + '"> <br><label for="translate">Translate to:</label> <select id="translate" name="translate"><option value="">None</option><option value="he">Hebrew</option><option value="es">Spanish</option><option value="fr">French</option></select> <br><input type="submit" value="Submit"></form>';
        res.send(form);
    });
};