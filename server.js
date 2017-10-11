var express = require('express');
var app = express();
var server = require('http').createServer(app); // in production dovrebbe diventare https
var helmet = require('helmet');
var bodyparser = require('body-parser');
var pdf = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
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

// parsing richieste in post (per le form)
app.use(bodyparser.urlencoded({ extended: true }));

// app routes
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'www/index.html'));
});
app.get('/nre', function(req, res) {
    // attualmente un timestamp in js occupa 41 bit, il * 128 (che sarebbe << 7) serve per farlo venire 6 bytes precisi
    // questo giochino andrà bene finchè il ts non diventerà di 42 bit, il Wed Sep 07 2039 17:47:35 GMT+0200 (CEST)
    // ci vogliono circa 16 richieste in un millisecondo per avere il 50% di prob. che vengano generati 2 NRE uguali
    res.send((Date.now() * 128 + crypto.randomBytes(1).readUInt8(0)).toString(36).slice(0, 10)); // un numero di 48bit in base 36 ha 10 cifre
});
app.post('/pdf/:nre', function(req, res) {
    var percorso = path.join(__dirname, '/www/pdf/' + req.params.nre + '.pdf');
    var doc = new pdf();
    doc.pipe(fs.createWriteStream(percorso));
    doc.text(req.body);
    doc.end();
    res.download(percorso, req.params.nre + '.pdf', function(err) {
        if(!err) fs.unlink(percorso); // elimina file se il download completa con successo
    });
});

// start server
server.listen(3000, 'localhost', function() {
    console.log('Server express in ascolto sulla porta 3000');
});
