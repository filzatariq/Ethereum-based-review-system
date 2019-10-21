App = {
  web3Provider: null,
  contracts: {},

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    // App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('ProductReview.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var ProductReviewArtifact = data;
      App.contracts.ProductReview = TruffleContract(ProductReviewArtifact);
    
      // Set the provider for our contract
      App.contracts.ProductReview.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      // return App.markAdopted();
      return App.GetAllReviews();

    });

    // return App.bindEvents();
     return App.GetAllReviews();

  },
  

  
  GetReview: function() {
    var id = this.id;
    alert(web3.eth.accounts[0]);
    var address = web3.eth.accounts[0];
    var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        return prodInstance.getReview(id, address);
      }).then(function(result) {
        console.log(result);
      });
    
  },

  GetAllReviews: function() {
    var id = 1;
    console.log(id);
    var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        return prodInstance.getReviewsCountOfaProduct(id);
      }).then(function(result) {

        counts = result.c[0]
        console.log("Total Reviews : "+counts);
        for (i = 0; i < counts; i ++) {
          console.log('hehe');
          App.GetOneReview(id,i);
        }
      });
    
  },

  GetOneReview:function(id,index){
    var prodInstance;
    console.log(id);
    console.log(index);
    console.log('^id');
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        // Execute adopt as a transaction by sending account
        //reject(new Error("Whoops!"));
        console.log(prodInstance);
        prodInstance.getAReview(id,index).then(function(result) {

        console.log("review:"+result[0]);
        console.log("address:"+result[1]);

        var reviews = $('#productreviews');
        var template = $('#reviewtemplate');

        template.find('.review').text(result[0]);
        template.find('.address').text(result[1]);
        reviews.append(template.html());
      }).catch(err => console.log(err));
      }).catch(err => console.log(err));
  },

 



};

$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
});
