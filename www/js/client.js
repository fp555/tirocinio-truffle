App = {
    account: {}, // account che interagisce con il contratto
    contract: {}, // contratto truffle
    instance: {}, // istanza smart contract su bc
    timer: {}, // timer per controllo cambio account
    enumRuoli: ["guest", "admin", "farma", "medic"],
    enumStati: {
        INVALIDO: 0,
        NONEROGATO: 1,
        EROGATO: 2
    },
    socket: io('http://localhost:3000/', {reconnectionAttempts: 1}), // websocket per livereload;

    init: function() {
        Object.freeze(App.enumStati); // perché const del javascript è una barzelletta
        Object.freeze(App.enumRuoli);
        // Checking if Web3 has been injected by the browser
        if(typeof web3 !== 'undefined') web3 = new Web3(web3.currentProvider); // Use Mist/MetaMask's provider
        else {
            console.log('No Mist/MetaMask - fallback to testrpc');
            web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        // inizializza il contratto
        $.getJSON('/contracts/Prescriptions.json', function(data) {
            App.contract = TruffleContract(data);
            App.contract.setProvider(web3.currentProvider);
            App.contract.deployed().then(function(i) {
                App.instance = i;
            });
        });
        // set account da utilizzare
        web3.eth.getAccounts(function(error, accounts) {
            if(error) console.log(error);
            else {
                App.account = accounts[0]; // cambia 0 con un altro numero per fare prove multiaccount senza MetaMask
                App.checkRole();
            }
        });
        // controllo se cambia l'account in background (Metamask)
        App.timer = setInterval(function() {
            web3.eth.getAccounts(function(error, accounts) {
                if(accounts[0] != App.account) {
                    App.account = accounts[0];
                    window.location.reload();
                }
            });
        }, 1000); // ogni secondo
    },
    
    checkRole: function() {
        App.contract.deployed().then(function(instance) {
            instance.getRole.call({from: App.account}).then(function(r) {
                var role = parseInt(r.toString());
                $(".container").load('/pages/' + App.enumRuoli[role] + '.html', function() {
                    App[App.enumRuoli[role]](); // lo so che non è una cosa bella, ma eval è peggio
                });
            });
        });
    },

    admin: function() {
        $("#roleselect").change(function() {
            $(".form-group").css('visibility', ($("#roleselect").val() === "")? 'hidden' : 'visible');
        });
        //popolo la select dell'admin con gli account presenti sulla blockchain
        /*web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            $.each(accounts, function(key, value) {
                $('#accountselect').append($('<option>', { value : value }).text(value));
            });
        });*/
        $("#registra").click(function(event) {
            event.preventDefault();
            App.registra({
                nome : $("#nome").val(),
                cognome : $("#cognome").val(),
                ruolo : $("#roleselect").val(),
                account: $("#accountselect").val()
            });
        });
    },
    
    registra: function(form) {
        console.log(form);
        App.contract.deployed().then(function(instance) {
            App.instance.setAccount(form.account, form.nome, form.cognome, form.ruolo, {from: App.account}).then(function() {
                App.checkRole();
            });
        });
    },
    
    medic: function() {
        $("#show").css("display","none");
        $("#new").css("display","none");
        $.get("/nre", function(nre) {
            $("#nre").val(nre); // una stringa di 10 caratteri generata dal server
        });
        $("#data").val(new Date());
        App.instance.getName.call({from: App.account}).then(function(medico) {
            $("#nome-medico").val(medico[0] + " " + medico[1]);
            $("#acc-medico").val(App.account);
        });
        $("#ricetta").submit(function(event) {
            event.preventDefault();
            //disabilito il tasto submit
            $("#crea").addClass('disabled');
            $("#data").val(Date.parse($("#data").val()));
            //serializzo il contenuto della form in un oggetto json
            var array = jQuery(this).serializeArray();
            var json = {};
            jQuery.each(array, function() {
                json[this.name] = this.value || '';
            });
            console.log("JSON.stringify(json)", JSON.stringify(json));
            var hash = web3.sha3(JSON.stringify(json));
            console.log("hash", hash);
            console.log("web3.fromAscii(hash)", web3.fromAscii(hash));
            var nre = parseInt($("#nre").val(), 36); // sotto forma di numero (48 bit)  web3.fromAscii(hash)
            App.instance.insRicetta(nre, hash, {from: App.account}).then(function() { // ci vuole fromAscii per scriverlo bene, e toAscii per leggerlo bene
                $.post("/pdf/" + $("#nre").val(), json, function(data) {
                    //mostro i bottoni e aggancio i relativi eventi
                    $("#show").css("display","inline");
                    $("#new").css("display","inline");
                    $("#show").on('click', function(event) {
                        event.preventDefault();
                        printJS(data.pdf);
                    });
                    $("#new").on('click', function(event) {
                        event.preventDefault();
                        location.reload();
                    });
                    printJS(data.pdf);// Firefox lo apre in una nuova tab, Chrome in un iframe
                }, "json");
            });
        });
    },

    farma : function() {
        var video = document.getElementById("video");
        var canvas = document.getElementById("canvas");
        var context = canvas.getContext("2d");
        var width = parseInt(canvas.style.width);
        var height = parseInt(canvas.style.height);
        var localStream; // variabile che contiene stream video
        // per la view del canvas
        canvas.width = width;
        canvas.height = height;
        // accesso alla webcam
        navigator.mediaDevices.getUserMedia({video: true}).then(function(stream) {
            if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
            else if (video.mozSrcObject !== undefined) video.mozSrcObject = stream;
            else video.src = stream;
            localStream = stream.getTracks()[0];
        });
        // callback per scan feed video
        function scan() {
            if(video.readyState === video.HAVE_ENOUGH_DATA) {
                // Load the video onto the canvas
                context.drawImage(video, 0, 0, width, height);
                // Load the image data from the canvas
                var imageData = context.getImageData(0, 0, width, height);
                var binarizedImage = jsQR.binarizeImage(imageData.data, imageData.width, imageData.height);
                var location = jsQR.locateQRInBinaryImage(binarizedImage);
                if(location) var rawQR = jsQR.extractQRFromBinaryImage(binarizedImage, location);
                if(rawQR) var decoded = jsQR.decodeQR(rawQR);
                if(decoded) {
                    var ricetta = JSON.parse(decoded);
                    $("#nre").text(ricetta.nre);
                    $("#data").text(new Date(parseInt(ricetta.data)));
                    $("#medico").text(ricetta["nome-medico"]);
                    $("#paziente").text(ricetta["nome-paziente"] + " " + ricetta["cognome-paziente"]);
                    $("#prescrizione").text(ricetta.prescriz);
                    var hash = web3.sha3(decoded); // ricreo l'hash che devo cercare sulla blockchain (è uguale a quello generato lato medico)
                
                    console.log(hash);
                    App.instance.getRicetta.call(parseInt(ricetta.nre, 36), {from: App.account}).then(function(data) {
                        // data contiene acount medico prescrittore, hash, stato ricetta
                        console.log(data);
                        var valida = hash === data[1];
                        var erogata = data[2] != "0x0";
                        console.log(erogata);
                        $("#stato").text(erogata ? "Erogata" : "Non erogata");
                        $(".jumbotron").css("display", "block");
                    
                        //verde(valida e non erogata), rossa(non valida e erogata), giallo(non erogata e non valida),
                        $(".jumbotron").css("background-color", (valida && !erogata) ? "#dff0d8" : ((!valida && erogata) ? "#f2dede" : "#fcf8e3"));
                        $("#validation").text(valida ? (!erogata ? "Ricetta EROGABILE" : "Ricetta GIÀ EROGATA") : "Ricetta NON VALIDA");
                        $("#validationMsg").text(valida ? (!erogata ? "È possibile erogare la ricetta" : "Ricetta già erogata in un'altra farmacia") : "Ricetta contraffatta, non erogare");
                        $("#validationBtn").text(valida && !erogata ? "Eroga" : "Annulla");
                        $("#validationBtn").addClass(valida && !erogata ? "btn-success" : "btn-danger");
                        $("#validationBtn").on('click', function(event) {
                            event.preventDefault();
                            if(valida && !erogata) {
                                App.instance.erogaRicetta(parseInt(ricetta.nre, 36), {from: App.account}).then(function() {
                                    $("#modal").click(function(event) {
                                        event.preventDefault();
                                        window.location.reload();
                                    });
                                });
                            }
                            else window.location.reload();
                        });
                    });
                localStream.stop();
                }
            }
            requestAnimationFrame(scan); // loop scansione
        };
        requestAnimationFrame(scan);
    },

    guest: function() {} // per il momento il guest non fa niente
};

$(function() { // equivale a $(document).ready()
    App.init();
    App.socket.on('fcevent', function() {
        window.location.reload(); // implementazione livereload
    });
});