pragma solidity ^0.4.4;

/**
 * This contract does this and that...
 */
contract Prescriptions {

	struct InfoMedico {
		string name;
		string surname;
		string specialization;
	}

	//mapping utente-ruoli
	mapping (address => string) internal roles ;

	//mapping medico-anagrafica
	mapping (address => InfoMedico) public infos;
	
	function getRole() public returns (string) {
		return roles[msg.sender];
	}

	function setRole(string role) public {
		roles[msg.sender] = role;
	}

}
