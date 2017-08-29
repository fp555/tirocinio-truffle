pragma solidity ^0.4.4;

contract Prescriptions {
	struct InfoMedico {
		string name;
		string surname;
	}
	enum StatiRicetta {
        nonErogato, // 0
        parzErogato, // 1
        erogato // 2
    }

	bytes32[] ricette;

	//mapping utente-ruoli
	mapping (address => string) internal roles;

	//mapping accounts-anagrafica
	mapping (address => InfoMedico) internal medici;
	
	//mapping ricette-stati
	mapping (bytes32 => StatiRicetta) internal stati;
	

	function getRole() public returns (string) {
		return roles[msg.sender];
	}

	function setMedico(string nome, string cognome, string role) public {
		medici[msg.sender] = InfoMedico({
			name : nome,
			surname : cognome
			});
		roles[msg.sender] = role;
	}

	function getMedico() public returns (string, string) {
		return (medici[msg.sender].name, medici[msg.sender].surname);
	}

	//prende ultima ricetta inserita
	function getLastId() public returns (uint nre) {
		nre = ricette.length;
	}

    //setta solo lo stato di una ricetta
	function setStatoRicetta(uint8 stato, uint nre) public {
		stati[ricette[nre]] = StatiRicetta(stato);
	}
	
	//3 parametri: inserisce una nuova ricetta più il suo stato
	function setRicetta(uint8 stato, uint nre, bytes32 ricetta) public {
		ricette.push(ricetta);
        setStatoRicetta(stato, nre);
	}
}