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
      App.initialSetup();

      return App.GetAllReviews();

    });
    App.initialSetup();

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
    console.log(id);
    var url = new URL(window.location.href);
    var id = url.searchParams.get("skuID");
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
        console.log("address:"+result[2]);
        console.log("address:"+result[3]);
        console.log("status:"+result[4]);

        var reviews = $('#productreviews');
        var template = $('#reviewtemplate');

        template.find('.review').text(result[0]);
            template.find('.review').attr('skuId',id );
            template.find('.review').attr('index',parseInt(index) + 1);
        template.find('.address').text(result[1]);
        template.find('.upvote').html("<i class=\"fa fa-thumbs-up\" aria-hidden=\"true\"></i>\n(" + result[2] + ")");
        template.find('.upvote').attr("count",result[2]);
        template.find('.downvote').html("<i class=\"fa fa-thumbs-down\" aria-hidden=\"true\"></i>\n(" + result[3] + ")");
        template.find('.downvote').attr("count",result[3]);

        var icon_div_class ="";

        var status =result[4];
          template.find('.status-icon').removeClass("fa-ban");
          template.find('.status-icon').removeClass("fa-check");
          template.find('.status-icon').removeClass("fa-clock-o");
          template.find('.icon-div').removeClass("btn-danger");
          template.find('.icon-div').removeClass("btn-success");
          template.find('.icon-div').removeClass("btn-info");

        if(status == "rejected"){
          icon_div_class ="btn-danger";
          template.find('.status-icon').addClass("fa-ban");
        }else if (status == "approved"){
          icon_div_class ="btn-success";
          template.find('.status-icon').addClass("fa-check");
        }else{
          icon_div_class ="btn-info";
          template.find('.status-icon').addClass("fa-clock-o");
        }

        template.find('.icon-div').addClass(icon_div_class);

        reviews.append(template.html());
      }).catch(err => console.log(err));
      }).catch(err => console.log(err));
  },


  upVote:function(skuId,reviewId,clicked_refer){
    console.log(reviewId);
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance) {
      prodInstance = instance;
      // Execute adopt as a transaction by sending account
      //reject(new Error("Whoops!"));
      console.log(prodInstance);
      prodInstance.upVote(skuId,reviewId).then(function(result) {
        var clicked_ref = clicked_refer;
        var count = parseInt($(clicked_ref).attr('count') ) + 1;
          $(clicked_ref).attr('count',count);
          $(clicked_ref).html("<i class=\"fa fa-thumbs-up\" aria-hidden=\"true\"></i>\n(" + parseInt(count )+ ")");

          console.log(result);
      }).then(()=>{
        $.notify("You have successfully upvoted the review!", "success");
      }).catch(err => {
        if(err.code == 4001){
          $.notify("You have rejected your vote", "info");
        }else{
          $.notify("You are not allowed to Vote this review", "error");
        }
      });
    }).catch(err => console.log(err));
  },
  downVote:function(skuId,reviewId,clicked_refer){
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance) {
      prodInstance = instance;
      // Execute adopt as a transaction by sending account
      //reject(new Error("Whoops!"));
      console.log(prodInstance);
      prodInstance.downVote(skuId,reviewId).then(function(result) {
          var clicked_ref = clicked_refer;
        var count = parseInt($(clicked_ref).attr('count') ) + 1;
        $(clicked_ref).attr('count',parseInt(count));
          $(clicked_ref).html("<i class=\"fa fa-thumbs-down\" aria-hidden=\"true\"></i>\n(" + parseInt(count )+ ")");
        console.log(result);
      }).then(()=>{
        $.notify("You have successfully downvoted the review!", "success");
      }).catch(err => {
        $.notify("You are not allowed to Vote this review", "error");

      });
    }).catch(err => console.log(err));
  },
  getVoteCount:function(skuId,reviewId){
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance) {
      prodInstance = instance;
      // Execute adopt as a transaction by sending account
      //reject(new Error("Whoops!"));
      console.log(prodInstance);
      prodInstance.getVoteCount(skuId,reviewId).then(function(result) {

        console.log(result);
      }).catch(err => console.log(err));
    }).catch(err => console.log(err));
  },
  getAccountValues:function(skuId,reviewId){
    var prodInstance;
    App.contracts.ProductReview.deployed().then(function(instance) {
      prodInstance = instance;
      // Execute adopt as a transaction by sending account
      //reject(new Error("Whoops!"));
      console.log(prodInstance);
      prodInstance.getAccountValues().then(function(result) {

        console.log(result);
      }).catch(err => console.log(err));
    }).catch(err => console.log(err));
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
}
};

$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
});

$(document).on("click",".upvote",function () {
    var t =this;
    //make it closest
    App.upVote($(this).parent().find(".review").attr("skuId"),$(this).parent().find(".review").attr("index"),t);
});

$(document).on("click",".downvote",function () {
    var t =this;
  App.downVote($(this).parent().find(".review").attr("skuId"),$(this).parent().find(".review").attr("index"),t);
});