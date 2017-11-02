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
                console.log(accounts);
                App.account = accounts[0]; // cambia 0 con un altro numero per fare prove multiaccount senza MetaMask
                App.checkRole();
            }
        });
    },
    
    checkRole: function() {
        App.contract.deployed().then(function(instance) {
            instance.getRole.call({from: App.account}).then(function(r) {
                var role = parseInt(r.toString());
                console.log("enumrole", App.enumRuoli[role]);
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
        web3.eth.getAccounts(function(error,accounts) {
            if(error) console.log(error);
            $.each(accounts, function(key, value) {
                $('#accountselect').append($('<option>', { value : value }).text(value));
            });
        });

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
            console.log(instance);
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
            var nre = parseInt($("#nre").val(), 36); // sotto forma di numero (48 bit)
            App.instance.insRicetta(nre, web3.fromAscii(hash), {from: App.account}).then(function() { // ci vuole fromAscii per scriverlo bene, e toAscii per leggerlo bene
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
    }
};

$(function() { // equivale a $(document).ready()
    App.init();
    App.socket.on('fcevent', function() {
        window.location.reload(); // implementazione livereload
    });
});