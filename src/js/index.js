App = {
    contract: {}, // variabile contratto
    
    init: function() {
        // inizializza web3
        if (typeof web3 !== 'undefined') { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
            // Use Mist/MetaMask's provider
            window.web3 = new Web3(web3.currentProvider);
        } else {
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
            if(role === "medic" || role === "farma") {
                $(".container").load('pages/' + role + '.html', function() {
                    //execute here after load completed
                });
            }
        });
    },
    
    registra: function(form) {
        web3.eth.getAccounts(function(error,accounts) {
            if(error) {
                console.log(error);
            }
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
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});