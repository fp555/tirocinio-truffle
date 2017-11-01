var express = require('express');
var app = express();
var server = require('http').createServer(app); // in production dovrebbe diventare https
var helmet = require('helmet');
var bodyParser = require('body-parser');
var pdf = require('pdfkit');
var qr = require('qr-image');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

var QRCode = require('qrcode')


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
    var percorso = path.join(__dirname, '/www/pdf/' + req.params.nre + '.pdf');
    var doc = new pdf({
        size: 'B6'
    });
    console.log(JSON.stringify(req.body));
    // setto subito gli header della risposta
    //res.setHeader('Content-type', 'application/pdf');
    //res.setHeader('Content-disposition', 'inline; filename=' + req.params.nre + '.pdf');
    // creo il qrcode
    QRCode.toFile(path.join(__dirname, '/www/pdf/qr.PNG'), JSON.stringify(req.body), function(error){
        if (error) throw error;
    });
    var perco = path.join(__dirname, '/www/pdf/qr');
    console.log(perco);
    var qr_png = doc.openImage(perco + '.png');
    //creo il pdf
    doc.pipe(fs.createWriteStream(percorso));
    doc.fontSize(20).text("Ricetta medica", qr_png.width - 20, (qr_png.height / 2), {
        align: 'center',
        ellipsis: true,
        width: doc.page.width - qr_png.width,
        valign: 'top'
    }).moveDown();
    doc.font('Times-Bold', 10).text("Medico: ", 50, 150, {
        align: 'left', 
        continued: true, 
        width: doc.page.width - 50}).font('Courier').text(req.body['nome-medico']).moveDown();
    doc.font('Times-Bold', 10).text("Account medico: ", {continued: true});
    doc.font('Courier').text(req.body['acc-medico']).moveDown();
    doc.font('Times-Bold', 10).text("NRE: ", {continued: true});
    doc.font('Courier').text(req.body.nre).moveDown();
    doc.font('Times-Bold', 10).text("Data: ", {continued: true});
    var temp = new Date(parseInt(req.body.data));
    doc.font('Courier').text(temp).moveDown();
    doc.font('Times-Bold', 10).text("Paziente: ", {continued: true});
    doc.font('Courier').text(req.body['nome-paziente'] + " " + req.body['cognome-paziente']).moveDown();
    doc.font('Times-Bold', 10).text("Prescrizione: ");
    doc.font('Courier').text(req.body.prescriz);
    //inserisco qr_code
    doc.image(qr_png, 0, 0, {
        fit: [150, 150]
    });
    doc.save();
    doc.end();
    var filename = req.params.nre + '.pdf';
    //fs.unlink(perco + '.png');
    res.json({'pdf' : 'http://localhost:3000/pdf/' + filename});
    //res.download(percorso, req.params.nre + '.pdf', function(err) {
        //if(!err) fs.unlink(percorso); // elimina file se il download completa con successo
    //});
});

// start server
server.listen(3000, 'localhost', function() {
    console.log('Server express in ascolto sulla porta 3000');
});
