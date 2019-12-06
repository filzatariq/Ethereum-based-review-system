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
      return App.init();

    });

    //return App.bindEvents();
      return App.AddProductButton();

  },
  init: async function() {
    // Load Products.
    var prodInstance;

    App.contracts.ProductReview.deployed().then(function(instance){
      prodInstance = instance;
      return prodInstance.productCount();
    }).then(function(result){

      var counts = result.c[0];
      console.log("Total Prods : "+counts);

      for (i = 0; i < counts; i ++) {
         App.GetProduct(i);
      }
    });
    // return await App.initWeb3();  
    return App.bindEvents();  
  },
  GetAll:function(){
    App.contracts.ProductReview.deployed().then(function(all){
      console.log(all);
    });
  },

  GetProduct:function(index){
    App.contracts.ProductReview.deployed().then(function(instance){
          prodInstance = instance;
          return prodInstance.getAProduct(index);
        }).then(function(result){
          // console.log(result);
          console.log("Sku : "+result[0].c[0]);
          console.log("Name : "+result[1]);
          console.log("Desc : "+result[2]);
          console.log("Price : "+result[3].c[0]);
          console.log("Qty : "+result[4].c[0]);

          //load the new added product
          var petsRow = $('#petsRow');
          var petTemplate = $('#petTemplate');

          petTemplate.find('.panel-title').text(result[1]);
          // petTemplate.find('img').attr('src', data[i].picture);
          petTemplate.find('.desc').text(result[2]);
          petTemplate.find('.price').text(result[3]);
          petTemplate.find('.quant').text(result[4]);

          petTemplate.find('.btn-buy').attr('data-id', result[0].c[0]);
          petTemplate.find('.btn-buy').attr('data-attribute', result[3].c[0]);
          petTemplate.find('.btn-review').attr('data-id', result[0].c[0]);
          petTemplate.find('.btn-review').attr('id', result[0].c[0]);
          petTemplate.find('.get-review').attr('id', result[0].c[0]);
          petTemplate.find('.get-all-reviews').attr('id', result[0].c[0]);
          petTemplate.find('.reviewbox').attr('id', result[0].c[0]);
          petsRow.append(petTemplate.html());
    
        });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-buy', App.handleBuy);
    $(document).on('click', '.btn-review', App.AddReview);
    $(document).on('click', '.get-review', App.GetReview);
    $(document).on('click', '.get-all-reviews', App.GetAllReviews);

  },

    handleBuy: function(event) {
    event.preventDefault();

    var prodId = parseInt($(event.target).data('id'));
    var prodInstance;
    var tokeninstance;
    var buyeraddress = web3.eth.accounts[1];

      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        var price = parseInt($(event.target).data('attribute'));
        alert(price)
        // Execute adopt as a transaction by sending account
        return prodInstance.buyProduct(prodId, {value: price });
      }).then(function(result) {
        console.log("Bought");
      });
    //   .then(App.contracts.PRToken.deployed().then(function(instance)
    // {
    //   tokeninstance = instance;
    //   return tokeninstance.transfer();
    // })).then(function(result){
    //   console.log(result);
    // });
  },

  AddProductButton: function() {
    $(document).on('click', '.addProd', App.AddProduct);
  },

  AddReview: function() {
    var review = document.getElementById(this.id).value
    var id = this.id;
    var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        // Execute adopt as a transaction by sending account
        return prodInstance.reviewProduct(id, review);
      }).then(function(result) {
        console.log("Reviewed");
        console.log(result);
      }).catch((error)=>{
          console.log(error);
      });
    
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
    var id = this.id;
    var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        return prodInstance.getReviewsCountOfaProduct(id);
      }).then(function(result) {
      console.log(result);
        counts = result.c[0]
        console.log("Total Reviews : "+counts);
        for (i = 0; i < counts; i ++) {
          App.GetOneReview(id,i);
        }
      });
    
  },

  GetOneReview:function(id,index){
    var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        // Execute adopt as a transaction by sending account
        //reject(new Error("Whoops!"));
        console.log(prodInstance);
        prodInstance.getAReview(id,index).then(function(result) {

        console.log(result);

        var reviews = $('#productreviews');
        var template = $('#reviewtemplate');
        template.find('.review').text(result);
        reviews.append(template.html());
      }).catch(err => console.log(err));
      }).catch(err => console.log(err));
  },

  AddProduct:function(event){
    var name = document.getElementById('name').value
    var skuId = document.getElementById('skuId').value
    var desc = document.getElementById('desc').value
    var price = document.getElementById('price').value
    var qty = document.getElementById('qty').value

    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance){
      prodInstance = instance;
      return prodInstance.addProduct(skuId, name,desc, price, qty);
      // return prodInstance.addProduct(skuId, name,desc, price, qty).call({gas: 4712388})
    }); 
    console.log("Done");
  }

};

$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
});

// $(document).on('click', '.btn-review', App.AddReview);
// $(document).on('click', '.get-review', App.GetReview);
// $(document).on('click', '.get-all-reviews', App.GetAllReviews);
