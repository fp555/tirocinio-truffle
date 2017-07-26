pragma solidity ^0.4.4;

contract Prescriptions {

	struct InfoMedico {
		string name;
		string surname;
		string specialization;
	}

	//mapping utente-ruoli
	mapping (address => string) internal roles ;

	//mapping medico-anagrafica
	mapping (address => InfoMedico) public medici;
	
	function getRole() public returns (string) {
		return roles[msg.sender];
	}


	function setMedico(string nome, string cognome, string specializzazione, string role) public {
		medici[msg.sender] = InfoMedico({
			name : nome,
			surname : cognome,
			specialization : specializzazione
			});
		roles[msg.sender] = role;
	}

	/*function setRole(string role) internal {
	roles[msg.sender] = role;
	}
	*/

	function getMedico() public returns (string,string,string,string) {
		return (medici[msg.sender].name,medici[msg.sender].surname,medici[msg.sender].specialization,roles[msg.sender]);
	}
}