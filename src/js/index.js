App = {
    contract: {}, // variabile contratto
    web3Provider: null,
    
    init: function() {
        // inizializza web3
        if (typeof web3 !== 'undefined') { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
            // Use Mist/MetaMask's provider
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            console.log('No web3? You should consider trying MetaMask!')
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            web3 = new Web3(App.web3Provider);
        }
        // inizializza il contratto
        $.getJSON('Prescriptions.json', function(data) {
            App.contract.Prescriptions = TruffleContract(data);
            App.contract.Prescriptions.setProvider(App.web3Provider);
        }).then(function() {
            return App.checkRole();
        });
    },
    
    checkRole: function() {
        App.contract.Prescriptions.deployed().then(function(instance) {
            return instance.getRole.call();
        }).then(function(role) {
            console.log(role);
        });
    },
    
    registra: function() {
        
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});