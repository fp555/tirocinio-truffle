App = {
    account: {}, // account che interagisce con il contratto
    contract: {}, // variabile contratto
    socket: io('http://localhost:3000/', {reconnectionAttempts: 1}), // websocket per livereload;
    enumStati: {
        NONEROGATO: 0,
        PARZEROGATO: 1,
        EROGATO: 2
    },

    init: function() {
        Object.freeze(App.enumStati); // perché const del javascript è una barzelletta
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
        });
        // set account da utilizzare
        web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            else {
                App.account = accounts[0]; // cambia 0 con un altro numero per fare prove multiaccount senza MetaMask
                return App.checkRole();
            }
        });
    },
    
    checkRole: function() {
        App.contract.deployed().then(function(instance) {
            instance.getRole.call({from: App.account}).then(function(role) {
                console.log(role);
                if(role === "medic" || role === "farma") $(".container").load('/pages/' + role + '.html');
                else $(".container").load('/pages/reg.html');
            });
        });
    },
    
    registra: function(form) {
        var instance;
        App.contract.deployed().then(function(i) {
            instance = i;
            instance.setMedico(form.nome, form.cognome, form.ruolo, {from: App.account}).then(function() {
                instance.getMedico.call({from: App.account}).then(function(info) {
                    console.log(info);
                    App.checkRole();
                });
            });
        });
    },

    inserisciRicetta : function(event, data) {
        event.preventDefault();
        //timestamp ricetta
        var timestamp = Date.now();
        web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            var account = accounts[0];
            App.contract.deployed().then(function(instance) {
                return instance.getLastId.call();
            }).then(function(lastid) {
                var nre = parseInt(lastid.toString()) + 1;
                data = data + '&nre=' + nre;
                App.contract.deployed().then(function(instance) {
                    return instance.getMedico.call();
                }).then(function(medico) {
                    data = data + '&nome-medico='+medico[0]+ '&cognome-medico='+medico[1]+'&ts='+timestamp;
                    console.log(data);
                    var hashedData = web3.sha3(data);
                    console.log(hashedData);
                    App.contract.deployed().then(function(instance){
                        return instance.setRicetta(App.enumStati.NONEROGATO, nre - 1,hashedData, {from: account});
                    });
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
