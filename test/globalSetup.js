const http = require('http');

module.exports = async function (globalConfig, projectConfig) {
    if (projectConfig.globals.config.examplePage !== 'http://localhost:8765') {
        return;
    }

    global.server = http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Xdebug Helper Test Page</h1>');
    }).listen(8765);
}
