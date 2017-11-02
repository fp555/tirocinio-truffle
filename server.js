var express = require('express');
var app = express();
var server = require('http').createServer(app); // in production dovrebbe diventare https
var helmet = require('helmet');
var bodyParser = require('body-parser');
var pdf = require('pdfkit');
var QRCode = require('qr-image')
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
app.use('/pdf', express.static(path.join(__dirname, '/www/pdf')));

// parsing richieste in post (per le form)
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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
    var pdfpath = path.join(__dirname, '/www/pdf/' + req.params.nre + '.pdf');
    var qrpath = path.join(__dirname, '/www/pdf/qr.png');
    var doc = new pdf({
        layout: 'landscape',
        margin: 20,
        size: 'B6'
    });
    // creo il qrcode
    var qrstream = QRCode.image(JSON.stringify(req.body), {type: 'png'});
    var qrfile = qrstream.pipe(fs.createWriteStream(qrpath));
    qrfile.on('finish', function() {
        doc.pipe(fs.createWriteStream(pdfpath));
        var qr_png = doc.openImage(qrpath);
        // generazione elementi pdf
        //console.log(doc.page.width, doc.page.height, qr_png.width, qr_png.height);
        var temp = new Date(parseInt(req.body.data));
        doc.font('Times-Bold', 10).text("NRE: ", {continued: true}).font('Courier').text(req.body.nre).moveDown();
        doc.font('Times-Bold', 10).text("Medico: ", {continued: true}).font('Courier').text(req.body['nome-medico']).moveDown();
        doc.font('Times-Bold', 10).text("Data: ", 150, 20, {continued: true}).font('Courier').text(temp).moveDown();
        doc.font('Times-Bold', 10).text("Paziente: ", doc.page.width / 2, doc.y, {continued: true}).font('Courier').text(req.body['nome-paziente'] + " " + req.body['cognome-paziente']).moveDown();
        doc.image(qrpath, 0, (doc.page.height - 200) / 2, {fit: [200, 200]});
        doc.font('Times-Bold', 10).text("Prescrizione: ", 220, (doc.page.height - 200) / 2 + 10).font('Courier').text(req.body.prescriz);
        doc.font('Times-Bold', 10).text("Account medico: ", 20, doc.page.height - 50,  {continued: true}).font('Courier').text(req.body['acc-medico']).moveDown();
        doc.save();
        doc.end();
        var filename = req.params.nre + '.pdf';
        //fs.unlink(perco + '.png');
        res.json({'pdf' : 'http://localhost:3000/pdf/' + filename});
    });
});

// start server
server.listen(3000, 'localhost', function() {
    console.log('Server express in ascolto sulla porta 3000');
});
