pragma solidity ^0.4.15;

contract Prescriptions {
    enum Ruoli {
        NULL, // 0
        ADMIN, // 1
        FARMA, // 2
        MEDICO // 3
    }

	struct InfoAccount {
		string f1;
		string f2;
        Ruoli ruolo;
	}
    struct Ricetta {
        address medico;
        bytes32 sha3;
        address farma; // conta anche come stato ricetta
    }

    modifier onlyAdmin {
        require(accounts[msg.sender].ruolo == Ruoli.ADMIN);
        _;
    }
    modifier onlyFarma {
        require(accounts[msg.sender].ruolo == Ruoli.FARMA);
        _;
    }
    modifier onlyMedico {
        require(accounts[msg.sender].ruolo == Ruoli.MEDICO);
        _;
    }

	mapping(uint48 => Ricetta) private ricette; // mapping nre(6 bytes)-ricette
	mapping(address => InfoAccount) private accounts; // mapping accounts-anagrafica
	
    function Prescriptions() public { // setta accounts[0] admin al momento del deploy su bc
        accounts[msg.sender] = InfoAccount("Admin", "Admin", Ruoli.ADMIN);
    }
    function getName() public constant returns(string, string) {
		return (accounts[msg.sender].f1, accounts[msg.sender].f2);
	}
    function getRicetta(uint48 nre) public constant returns(address, bytes32, address) {
        return (ricette[nre].medico, ricette[nre].sha3, ricette[nre].farma);
    }
	function getRole() public constant returns(Ruoli) {
		return accounts[msg.sender].ruolo;
	}
	function setAccount(address acc, string nome, string cognome, uint8 role) public onlyAdmin {
		accounts[acc] = InfoAccount(nome, cognome, Ruoli(role));
	}
    function insRicetta(uint48 nre, bytes32 hash) public onlyMedico {
		ricette[nre] = Ricetta(msg.sender, hash, 0x0);
	}
	function erogaRicetta(uint48 nre) public onlyFarma {
		ricette[nre].farma = msg.sender;
	}
	function() external payable {} // funzione fallback (sink ether)
}