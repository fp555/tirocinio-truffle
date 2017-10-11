App = {
    account: {}, // account che interagisce con il contratto
    contract: {}, // contratto truffle
    instance: {}, // istanza smart contract su bc
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
        web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            else {
                App.account = accounts[0]; // cambia 0 con un altro numero per fare prove multiaccount senza MetaMask
                App.checkRole();
            }
        });
    },
    
    checkRole: function() {
        App.contract.deployed().then(function(instance) {
            instance.getRole.call({from: App.account}).then(function(r) {
                var role = parseInt(r.toString());
                console.log(App.enumRuoli[role]);
                $(".container").load('/pages/' + App.enumRuoli[role] + '.html', function() {
                    App[App.enumRuoli[role]](); // lo so che non è una cosa bella, ma eval è peggio
                });
            });
        });
    },
    
    registra: function(form) {
        App.contract.deployed().then(function(instance) {
            App.instance.setAccount(form.nome, form.cognome, form.ruolo, {from: App.account}).then(function() {
                App.checkRole();
            });
        });
    },
    
    medic: function() {
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
            $("#data").val(Date.parse($("#data").val()));
            var serial = $(this).serialize();
            console.log(serial);
            var hash = web3.sha3(serial);
            var nre = parseInt($("#nre").val(), 36); // sotto forma di numero (48 bit)
            console.log(nre);
            console.log(hash);
            App.instance.insRicetta(nre, web3.fromAscii(hash), {from: App.account}).then(function() { // ci vuole fromAscii per scriverlo bene, e toAscii per leggerlo bene
                $.post("/pdf/" + $("#nre").val(), serial, function(pdf) {
                    printJS(pdf); // Firefox lo apre in una nuova tab, Chrome in un iframe
                });
            });
        });
    }
};

$(function() { // equivale a $(document).ready()
    App.init();
    App.socket.on('fcevent', function() {
        window.location.reload(); // implementazione livereload
    });
});
