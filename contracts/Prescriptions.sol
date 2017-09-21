pragma solidity ^0.4.15;

contract Prescriptions {
	struct InfoMedico {
		string name;
		string surname;
	}
	enum StatiRicetta {
        INVALIDO, // 0
        NONEROGATO, // 1
        EROGATO // 2
    }
    enum Ruoli {
        NONE, // 0
        ADMIN, // 1
        FARMA, // 2
        MEDICO // 3
    }

    modifier onlyFarma {
        require(roles[msg.sender] == Ruoli.FARMA);
        _;
    }
    modifier onlyMedico {
        require(roles[msg.sender] == Ruoli.MEDICO);
        _;
    }

	bytes32[] ricette; // array di (SHA3 delle) ricette
	mapping(address => Ruoli) internal roles; // mapping utente-ruoli
	mapping(address => InfoMedico) internal medici; // mapping accounts-anagrafica
	mapping(bytes32 => StatiRicetta) internal stati; //mapping ricette-stati
	
    function getLastId() public constant returns(uint) {
		return ricette.length;
	}
    function getMedico() public constant returns(string, string) {
		return (medici[msg.sender].name, medici[msg.sender].surname);
	}
	function getRole() public constant returns(Ruoli) {
		return roles[msg.sender];
	}
	function setMedico(string nome, string cognome, uint8 role) public {
		medici[msg.sender] = InfoMedico({
			name : nome,
			surname : cognome
		});
		roles[msg.sender] = Ruoli(role);
	}
    function setRicetta(uint8 stato, uint nre, bytes32 ricetta) public {
		ricette.push(ricetta);
        setStatoRicetta(stato, nre);
	}
	function setStatoRicetta(uint8 stato, uint nre) public {
		stati[ricette[nre]] = StatiRicetta(stato);
	}
	function() external payable {} // funzione fallback (sink ether)
}