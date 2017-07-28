pragma solidity ^0.4.4;

contract Prescriptions {

	struct InfoMedico {
		string name;
		string surname;
	}

	//stati ricetta
	enum StatiRicetta {nonErogato,parzErogato,erogato}

	bytes32[] ricette;

	//mapping utente-ruoli
	mapping (address => string) internal roles ;

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
	
	//inserisce l'hash della ricetta
	function setRicetta(bytes32 ricetta) public {
		ricette.push(ricetta);
	}
	
	//associa ad una ricetta lo stato 
	function setStatoRicetta(uint stato, uint nre) public {
		bytes32 hash = ricette[nre];
		stati[hash] = StatiRicetta(stato);
	}
	
}