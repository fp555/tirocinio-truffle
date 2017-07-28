App = {
    contract: {}, // variabile contratto
    enumStati: {},

    init: function() {
        Object.defineProperty(App.enumStati, "NONEROGATO",{
            value : 0, 
            writable : false
        });
        Object.defineProperty(App.enumStati, "PARZEROGATO",{
            value : 1, 
            writable : false
        });
        Object.defineProperty(App.enumStati, "EROGATO",{
            value : 2, 
            writable : false
        });

        // Checking if Web3 has been injected by the browser
        if (typeof web3 !== 'undefined') window.web3 = new Web3(web3.currentProvider); // Use Mist/MetaMask's provider
        else {
            console.log('No web3? You should consider trying MetaMask!')
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        // inizializza il contratto
        $.getJSON('Prescriptions.json', function(data) {
            App.contract = TruffleContract(data);
            App.contract.setProvider(web3.currentProvider);
        }).then(function() {
            return App.checkRole();
        });
    },
    
    checkRole: function() {
        App.contract.deployed().then(function(instance) {
            return instance.getRole.call();
        }).then(function(role) {
            console.log(role);
            if(role === "medic" || role === "farma") $(".container").load('pages/' + role + '.html');
            else $(".container").load('pages/reg.html');
        });
    },
    
    registra: function(form) {
        web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            var account = accounts[0];
            App.contract.deployed().then(function(instance) {
                return instance.setMedico(form.nome, form.cognome, form.ruolo, {from: account});
            }).then(function() {
                App.contract.deployed().then(function(instance) {
                    return instance.getMedico.call();
                }).then(function(info){
                    console.log(info);
                    return App.checkRole();
                });
            });
        });
    },

    inserisciRicetta : function(event, data) {
        event.preventDefault();
        var time = Date.now();
        //timestamp ricetta
        var timestamp = (time - (new Date().getTimezoneOffset() *60000 ));
        web3.eth.getAccounts(function(error,accounts){
            if(error) console.log(error);
            var account = accounts[0];
            App.contract.deployed().then(function(instance){
                return instance.getLastId.call();
            }).then(function(lastid){
                nre = parseInt(lastid.toString())+1;
                data = data + '&nre='+nre;
            }).then(function(){
                App.contract.deployed().then(function(instance){
                    return instance.getMedico.call();
                }).then(function(medico){
                    data = data + '&nome-medico='+medico[0]+ '&cognome-medico='+medico[1]+'&ts='+timestamp;
                    var hashedData = web3.sha3(data);
                    App.contract.deployed().then(function(instance){
                        return instance.setRicetta(hashedData, {from: account});
                    }).then(function(){
                        App.contract.deployed().then(function(instance){
                            return instance.setStatoRicetta(App.enumStati.NONEROGATO, nre, {from: account});
                        });
                    });
                });
            });
        });  
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});