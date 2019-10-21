var productReview = artifacts.require("ProductReview");
var PRToken = artifacts.require("PRToken");
module.exports = function(deployer){
    deployer.deploy(PRToken, 100).then( function(){
    	return deployer.deploy(productReview,PRToken.address);
    });
};
