pragma solidity >=0.4.0 <=0.6.0;
import "./PRToken.sol";


contract ProductReview {
    
    struct Status {
        bool isBuy;
        bool isReview;
        string reviewDescription;
        uint timeStamp;
    }

    struct EndorseValue{
         string status;
         uint upVoteCount;
         uint downVoteCount;
         address[] upVoters;
         address[] downVoters;
         mapping (address=>bool) user_endorsed;
    }
    
    struct Product {
        uint id;
        string name;
        string description;
        uint price;
        uint quantity;
        address payable productOwner;
        bool isExist;
        mapping (uint=>address) rater; //address of reviewer
        string [] reviews;
        uint reviewsCount;
        mapping (address=>Status) productUserReview; //store the status of buyer
        mapping (uint=>EndorseValue) endorse_value;
        mapping (address=>bool) Endorsers;
    }

    mapping (uint=>Product) public products;

    PRToken public tokencontract;
    uint[] productIds;
    uint public productCount;
    address public admin;
    uint reviewReturn = 1000;

     //for endorse
     mapping (address=>bool) public blackListed;
     address[] initialEndorsers;

     mapping (address=>uint) public honestReviews;
     mapping (address=>uint) public disHonestReviews;
     //end for endorse

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    constructor(PRToken _tokencontract) public{
      admin = msg.sender;
      tokencontract = PRToken(_tokencontract);
      initialEndorsers.push(0x9b5fd832362d7FCF595355F9D35833006Fb38301);
      initialEndorsers.push(0xC394C0b3d021bD67DDa11BFaD6A497e0cfF55c9E);
      initialEndorsers.push(0x886eBFdEf0fc72Db0a39b96Fad9548f3DE3f9F88);
      initialEndorsers.push(0xd99255A7032efD66EC10C07F282b3D5a907f02E4);
      initialEndorsers.push(0xa8A211F27e323BA01528fcd490109b4FFb6B24Df);
    }
    
    event sell(address _buyer, uint256 _token);
    event ProductRegistered(uint256 productId);
    event ProductRegistrationFailed(uint256 productId);

    function addProduct(uint skuId, string memory name, string memory description, uint price, uint quantity) public
    {
        require(products[skuId].isExist == false, "Product Already Added");
        productCount+=1;
        products[skuId].id = skuId;
        products[skuId].name = name;
        products[skuId].description = description;
        products[skuId].price = price;
        products[skuId].quantity = quantity;
        products[skuId].productOwner = msg.sender;
        products[skuId].isExist = true;
        productIds.push(skuId);

        for(uint i=0; i < 5;i++){
             products[skuId].Endorsers[initialEndorsers[i]]=true;
        }
    }
    
    function buyProduct(uint skuId) public payable
    {
           require(products[skuId].isExist == true, "Product Not Exist");
           require(products[skuId].quantity > 0, "Product Out of Stock");
           require (msg.value >= products[skuId].price , "Insufficient Ether passed");
           
           uint x=products[skuId].quantity;
           products[skuId].productUserReview[msg.sender].isBuy = true;
           products[skuId].quantity--;
           uint diff=x-products[skuId].quantity;
           
            if(msg.value > products[skuId].price)
            {
                msg.sender.transfer(msg.value - products[skuId].price); //extra ammount transferred
            }
            products[skuId].productOwner.transfer(products[skuId].price-reviewReturn); //Product price transferred to seller"
              msg.sender.transfer(reviewReturn); //1000 weis returned to buyer"   
              require(tokencontract.transfer(msg.sender,diff),"transferred Unsuccessful");
              emit sell (msg.sender , diff);
            
           
    }
    
    function reviewProduct(uint skuId, string memory review) public
    {
           require(tokencontract.reviewtoken(msg.sender,1), "Token check failed"); //reviewer possess token to review
           require(products[skuId].isExist == true, "Product Not Exist");
           require(products[skuId].productUserReview[msg.sender].isBuy == true, "You are not eligible to review this product");
           products[skuId].productUserReview[msg.sender].isReview == false;
          // require(products[skuId].productUserReview[msg.sender].isReview == false, "You have Already reviewed this product");
             
           products[skuId].productUserReview[msg.sender].isReview = true;
           products[skuId].productUserReview[msg.sender].reviewDescription = review;
           products[skuId].productUserReview[msg.sender].timeStamp = now;
           //tokencontract.reviewed();

           products[skuId].rater[products[skuId].reviewsCount] = msg.sender;
              products[skuId].reviews.push(review);
           // require(tokencontract.burn(1), "Burning failed");

           //for endorse
           //we will have three statuses [pending,approved,rejected]
           //products[skuId].endorse_value[products[skuId].reviewsCount].status = "pending";
           //products[skuId].endorse_value[products[skuId].reviewsCount].upVoteCount = 0;
           //products[skuId].endorse_value[products[skuId].reviewsCount].downVoteCount = 0;
           //end for endorse

           products[skuId].reviewsCount ++;

    }
    
    function getReview(uint skuId, address user) public view returns (string memory review)
    {
       return products[skuId].productUserReview[user].reviewDescription;
    }
    
    function getAReview(uint skuId, uint index) public view returns (string memory review, address reviewer,uint upvotes,uint downvotes,string memory status)
    {
       review = products[skuId].reviews[index];
       reviewer = products[skuId].rater[index];
       upvotes = products[skuId].endorse_value[index + 1].upVoteCount;
       downvotes = products[skuId].endorse_value[index + 1].downVoteCount;
       status = products[skuId].endorse_value[index + 1].status;
    }

    function getReviewsCountOfaProduct(uint skuId) public view returns (uint)
    {
       return products[skuId].reviewsCount;
    }

    function getAProduct(uint index) public view returns (uint skuId, string memory name, string memory description, uint256 price, uint256 quantity)
    {
       skuId = products[productIds[index]].id;
       name = products[productIds[index]].name;
       description = products[productIds[index]].description;
       price = products[productIds[index]].price;
       quantity = products[productIds[index]].quantity;
       
    }

    function upVote(uint skuId,uint reviewId) public {
         require(products[skuId].Endorsers[msg.sender],"You are not allowed to Endorse");//check if user is eligible to endorse
         require(!products[skuId].endorse_value[reviewId].user_endorsed[msg.sender],"You can only endorse on a review only once");//you can only endorse on a review only once
         require(keccak256(bytes  (products[skuId].endorse_value[reviewId].status)) == keccak256(bytes ("")),"You have already endorsed");//you can only endorse on review having status pending

         products[skuId].endorse_value[reviewId].user_endorsed[msg.sender] = true;
         products[skuId].endorse_value[reviewId].upVoteCount++;

         if(products[skuId].endorse_value[reviewId].upVoteCount == 3){
            products[skuId].endorse_value[reviewId].status = "approved";
            honestReviews[products[skuId].rater[reviewId - 1]]++;
         }

        if(honestReviews[products[skuId].rater[reviewId - 1]] > 1){
            products[skuId].Endorsers[products[skuId].rater[reviewId - 1]] = true;
        }
    }

    function downVote(uint skuId,uint reviewId) public{
         require(products[skuId].Endorsers[msg.sender],"You are not allowed to Endorse");//check if user is eligible to endorse
         require(!products[skuId].endorse_value[reviewId].user_endorsed[msg.sender],"You have already endorsed");//you can only endorse on a review only once
         require(keccak256( bytes (products[skuId].endorse_value[reviewId].status)) == keccak256(bytes  ("")),"You have already endorsed");//you can only endorse on review having status pending

         products[skuId].endorse_value[reviewId].user_endorsed[msg.sender] = true;
         products[skuId].endorse_value[reviewId].downVoteCount++;

         if(products[skuId].endorse_value[reviewId].downVoteCount == 3){
            products[skuId].endorse_value[reviewId].status = "rejected";
            disHonestReviews[products[skuId].rater[reviewId - 1]]++;
         }

         if(disHonestReviews[products[skuId].rater[reviewId - 1]] > 1){
            blackListed[products[skuId].rater[reviewId - 1]] = true;
         }
    }

    function getVoteCount(uint skuId,uint reviewId) public view returns (uint upVotes,uint downVotes)
     {
        upVotes = products[skuId].endorse_value[reviewId].upVoteCount;
        downVotes = products[skuId].endorse_value[reviewId].downVoteCount;
     }

    function isBlocked() public view returns (bool blocked){
        blocked = blackListed[msg.sender];
    }

    function getAccountValues()  public view returns (bool blocked,uint honestReviewsVal,uint disHonestReviewsVal,address a){
        blocked = blackListed[msg.sender];
        honestReviewsVal = honestReviews[msg.sender];
        disHonestReviewsVal = disHonestReviews[msg.sender];
        a = products[1].rater[1];
    }

 }