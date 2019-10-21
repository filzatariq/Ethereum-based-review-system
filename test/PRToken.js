var DappToken = artifacts.require("./PRToken.sol");

contract('DappToken', function(accounts) {
  var tokenInstance;
  var purchaser = accounts[1];
  var tokens = 2;

  it('initializes the contract with the correct values', function() {
    return DappToken.deployed().then (function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name) {

      assert.equal(name, 'PRT Token', 'has the correct name');
      return tokenInstance.symbol();

    }).then(function(symbol) {
      assert.equal(symbol, 'PRT', 'has the correct symbol');
      return tokenInstance.standard();
    });
  });

  it('allocates the initial supply upon deployment', function() {
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply) {
      assert.equal(totalSupply.toNumber(), 100, 'sets the total supply to 100');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(adminBalance) {
      assert.equal(adminBalance.toNumber(), 100, 'it allocates the initial supply to the admin account');
    });
  });
});