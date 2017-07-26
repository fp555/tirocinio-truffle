App = {
    contracts: {}, // variabile contratto
    
    init: function() {
        // inizializza web3
        if (typeof web3 !== 'undefined') { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
            window.web3 = new Web3(web3.currentProvider); // Use Mist/MetaMask's provider
        } else {
            console.log('No web3? You should consider trying MetaMask!')
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        }
        
        // inizializza il contratto
        $.getJSON('Prescriptions.json', function(data) {
            var prescriptionsArtifact = data;
            console.log(data);
            App.contracts.Prescriptions = TruffleContract(prescriptionsArtifact);
            App.contracts.Prescriptions.setProvider(window.web3);
            // return *il passo successivo dell'applicazione*
        });
        
        // return *bindevents per i clic*
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});