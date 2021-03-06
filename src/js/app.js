App = {
  web3Provider: null,
  contracts: {},

  initWeb3: async function() {
    window.web3.currentProvider.publicConfigStore.on('update',function (e) {
    });
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
    App.initialSetup();

    // Load Products.
    var prodInstance;

    App.contracts.ProductReview.deployed().then(function(instance){
      prodInstance = instance;
      return prodInstance.productCount();
    }).then(function(result){

      var counts = result.c[0];

      if(parseInt(counts) < 1){
          $("#no-prod-found-div").removeClass("hide");
      }

      console.log("Total Prods : "+counts);

      for (i = 0; i < counts; i ++) {
         App.GetProduct(i);
      }
    });
    App.getAllDiscounts();
    App.getProductCandidateEndorsers();
    App.getGlobalEndorsers();
    App.getProductEndorsers();
    console.log("()())(()()()()()()()()()()())(())(");
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
          petTemplate.find('.get-all-reviews').attr('href', "reviews.html?skuID="+result[0].c[0]);
          petTemplate.find('.get-all-candidates').attr('href', "candidateEndorser.html?skuID="+result[0].c[0]);
          petTemplate.find('.get-all-endorsers').attr('href', "endorser.html?skuID="+result[0].c[0]);
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
        $.notify("You have successfully bought the product. You can now review the product", "success");
      }).catch((err)=>{
        if(err.code == 4001){
          $.notify("You have rejected you product creation", "info");
        }else {
          $.notify("Something went wrong!. Please try again later", "error");
        }
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
    console.log(id,review);
	var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        // Execute adopt as a transaction by sending account
        return prodInstance.reviewProduct(id, review);
      }).then(function(result) {
        console.log("Reviewed");
        $.notify("You have successfully added the review", "success");
        console.log(result);
      }).catch((error)=>{
        if(error.code == 4001){
          $.notify("You have rejected review add", "info");
        }else {
          $.notify("You are not allowed to add the review", "error");
        }
        console.log(error);
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
    }).then(()=>{
      $.notify("Product Added Successfully. Refresh Page to see the product", "success");
    });
    console.log("Done");
  },

  isBlocked:function(){
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance){
      prodInstance = instance;
      return prodInstance.isBlocked();
      // return prodInstance.addProduct(skuId, name,desc, price, qty).call({gas: 4712388})
    }).then((result)=>{
      console.log(result);
    }).catch((error)=>{
      console.log(error);
    });
    console.log("Done");
  },
  initialSetup:function () {
      var prodInstance;
      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        // Execute adopt as a transaction by sending account
        //reject(new Error("Whoops!"));
        console.log(prodInstance);
        prodInstance.getAccountValues().then(function(result) {

          console.log(result);

          $(".loading").addClass("hide");

          if(result[0]){
              $("#main_div").addClass("hide");
              $("#ban_div").removeClass("hide");
          }else{
            $("#main_div").removeClass("hide");
            $("#ban_div").addClass("hide");
          }

        }).catch(err => console.log(err));
      }).catch(err => console.log(err));
  },

  getDiscountVal: function (index) {
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function (instance) {
      prodInstance = instance;
      prodInstance.getDiscountValues(index).then(function (result) {
        console.log(result);
        console.log(result[0].c[0]);
        console.log(result[1]);
        console.log(result[2].c[0]);
        if (result[2].c[0] != 0) {
          var reviews = $('#discounts');
          var template = $('#discounttemplate');

          template.find('.skuId').text(result[0].c[0]);
          template.find('.address').text(result[1]);
          template.find('.amount').text(result[2].c[0]);

          reviews.append(template.html());
        }
      }).catch((err) => {
        console.log(err);
      });
    });

  },

  getAllDiscounts: function() {
        var prodInstance;
        App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;

          App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;
            return prodInstance.getDiscountCount();
          }).then(function(result) {
            console.log(result);
            counts = result.c[0];
            console.log("Total Discounts : "+counts);
            for (i = 0; i < counts; i ++) {
              App.getDiscountVal(i);
            }
          });
        });

    },

    getGlobalEndorsers: function() {
        var prodInstance;
        App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;

            App.contracts.ProductReview.deployed().then(function(instance) {
                prodInstance = instance;
                prodInstance.getInitialEndorsers().then((result)=>{
                    console.log(result);
                  for (var i = 0; i < result.length; i ++) {
                    console.log(result[i]);

                    var reviews = $('#globalend');
                    var template = $('#globalendtemplate');

                    template.find('.address').text(result[i]);

                    reviews.append(template.html());
                  }
                });
            })
        });

    },

  getProductCandidateEndorsers: function() {
        var prodInstance;
    var url = new URL(window.location.href);
    var id = url.searchParams.get("skuID");
        App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;

            App.contracts.ProductReview.deployed().then(function(instance) {
                prodInstance = instance;
                prodInstance.getProductCandidateEndorsersAll(id).then((result)=>{
                    console.log(result);
                  for (var i = 0; i < result.length; i ++) {
                      console.log(result[i]);

                    var reviews = $('#candidates');
                    var template = $('#candidatestemplate');

                    template.find('.address').text(result[i]);

                    reviews.append(template.html());
                  }

                });
            })
        });

    },
  getIsProductEndorsers: function(skuID,address) {
        var prodInstance;

        App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;

            App.contracts.ProductReview.deployed().then(function(instance) {
                prodInstance = instance;
                prodInstance.getIsProductEndorsers(skuID,address).then((result)=>{
                    console.log(result);
                });
            })
        });

    },
  getProductEndorsers: function() {
        var prodInstance;
    var url = new URL(window.location.href);
    var id = url.searchParams.get("skuID");
    var result;
        App.contracts.ProductReview.deployed().then(function(instance) {
            prodInstance = instance;

            App.contracts.ProductReview.deployed().then(function(instance) {
                prodInstance = instance;
              prodInstance.getProductCandidateEndorsers(id).then((res)=>{
                result = res;
                for (var i = 0; i < result.length; i ++) {
                  prodInstance.getIsProductEndorsers(id,result[i]).then((result2)=>{
                    console.log(result2[0]);
                    console.log(result2[1]);
                    if(result2[0]){

                      var reviews = $('#endorsers');
                      var template = $('#endorserstemplate');

                      template.find('.address').text(result2[1]);

                      reviews.append(template.html());

                    }
                  });
                }

              });

            });
        });

    },
  pro: function(skuid) {
    var prodInstance;

    App.contracts.ProductReview.deployed().then(function(instance) {
      prodInstance = instance;

      App.contracts.ProductReview.deployed().then(function(instance) {
        prodInstance = instance;
        prodInstance.products(skuid).then((result)=>{
          console.log(result);
          console.log(result[8].c[0]);
        });
      })
    });

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
