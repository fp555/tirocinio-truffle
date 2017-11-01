var Prescriptions = artifacts.require("./Prescriptions.sol");

module.exports = function(deployer) {
  deployer.deploy(Prescriptions); //, {privateFor: ["ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc="]}
};