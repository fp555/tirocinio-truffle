var express = require('express');
var helmet = require('helmet');
var app = express();
var server = require('http').createServer(app); // in production dovrebbe diventare https
const path = require('path');

// livereload (per il browser) tramite websocket solo in dev
if(process.env.NODE_ENV === 'development') {
    var chokidar = require('chokidar');
    var io = require('socket.io')(server);
    console.log('development mode');
    chokidar.watch([path.join(__dirname, '/www/css'), path.join(__dirname, '/www/js'), path.join(__dirname, '/www/pages')]).on('change', function() {
        io.emit('fcevent');
    });
}

// setta alcuni middleware legati alla sicurezza (https://www.npmjs.com/package/helmet#how-it-works)
// in fase di production sarebbe opportuno abilitare anche gli altri legati all'https
app.use(helmet());

// app static routes (assunto che questo file sia nella root del progetto)
app.use('/contracts', express.static(path.join(__dirname, '/build/contracts')));
app.use('/css', express.static(path.join(__dirname, '/www/css')));
app.use('/fonts', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/fonts')));
app.use('/js', express.static(path.join(__dirname, '/www/js')));
app.use('/pages', express.static(path.join(__dirname, '/www/pages')));

// app routes
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'www/index.html'));
});

// start server
server.listen(3000, 'localhost', function() {
    console.log('Server express in ascolto sulla porta 3000');
});
