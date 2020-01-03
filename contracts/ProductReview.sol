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
        uint candidatesEndorsersCount;
        address[] candidatesEndorsers;
        address[] candidatesEndorsersC;

    }

    struct DiscountValue {
        uint skuID;
        address userAddr;
        uint discountAmount;
    }

    mapping (uint=>Product) public products;

    mapping (uint=>DiscountValue) public discountValues;

    uint public discountCount;

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
             products[skuId].candidatesEndorsers.push(initialEndorsers[i]);
             products[skuId].candidatesEndorsersCount++;
        }

    }
    
    function buyProduct(uint skuId) public payable
    {
           require(products[skuId].isExist == true, "Product Not Exist");
           require(products[skuId].productOwner != msg.sender, "You can buy your own product");
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

            uint minus_amount = reviewReturn;

            for(uint i=0; i < discountCount;i++){
                 if(discountValues[i].skuID == skuId && discountValues[i].userAddr == msg.sender){
                    minus_amount = minus_amount + discountValues[i].discountAmount;
                        delete discountValues[i];
                 }
            }

            products[skuId].productOwner.transfer(products[skuId].price - minus_amount); //Product price transferred to seller"
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

        //if(honestReviews[products[skuId].rater[reviewId - 1]] > 0){
        if(keccak256(bytes (products[skuId].endorse_value[reviewId].status)) == keccak256(bytes ("approved"))){
            bool already_exists = false;
            if(products[skuId].candidatesEndorsersCount != 0){
             for(uint i=0; i < products[skuId].candidatesEndorsersCount - 1;i++){
                if(products[skuId].rater[reviewId - 1] ==  products[skuId].candidatesEndorsers[i]){
                    already_exists = true;
                }
             }
            }

         //   if(!already_exists){

            products[skuId].candidatesEndorsers.push(products[skuId].rater[reviewId - 1]);
            products[skuId].candidatesEndorsersC.push(products[skuId].rater[reviewId - 1]);
            products[skuId].candidatesEndorsersCount++;

            if(products[skuId].candidatesEndorsersC.length == 2){
            uint randomNumForEndorser = rand(2);
            uint randomNumForEndorser2 = rand(4);

            products[skuId].Endorsers[products[skuId].candidatesEndorsersC[randomNumForEndorser]] = true;
            products[skuId].Endorsers[products[skuId].candidatesEndorsers[randomNumForEndorser2]] = false;

                 //selected_endorser = products[skuId].candidatesEndorsers;
                 //products[skuId].Endorsers[products[skuId].rater[reviewId - 1]] = true;

                 discountValues[discountCount].skuID = skuId;
                 discountValues[discountCount].userAddr = products[skuId].candidatesEndorsersC[randomNumForEndorser];
                 discountValues[discountCount].discountAmount = (10 * products[skuId].price) / 100;
                 discountCount++;

                 //change global endorsers
                 initialEndorsers.push(products[skuId].rater[reviewId - 1]);
                 uint randomNum = rand(5);
                 initialEndorsers[randomNum] = initialEndorsers[5];
                 delete initialEndorsers[5];
                 initialEndorsers.length--;

            //}
                delete products[skuId].candidatesEndorsersC;
            }
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

    function getAccountValues()  public view returns (bool blocked,uint honestReviewsVal,uint disHonestReviewsVal){
        blocked = blackListed[msg.sender];
        honestReviewsVal = honestReviews[msg.sender];
        disHonestReviewsVal = disHonestReviews[msg.sender];
        //a = products[1].rater[1];

//        disc = discountValues;
    }

    //get all the discount values
    function getDiscountValues(uint index) public view returns (uint skuID, address addr ,uint amount ){
        skuID = discountValues[index].skuID;
        addr = discountValues[index].userAddr;
        amount = discountValues[index].discountAmount;
    }

    //get discountCount
    function getDiscountCount() public view returns (uint count ){
        count = discountCount;
    }

    //get all the initial/global endorsers
    function getInitialEndorsers() public view returns (address[] memory addresses ){
        addresses = initialEndorsers;
    }

    //get endorsers of a product
    function getProductCandidateEndorsers(uint skuId) public view returns (address[] memory addresses ){
        addresses = products[skuId].candidatesEndorsers;
    }

    //get endorsers of a product all old and new
    function getProductCandidateEndorsersAll(uint skuId) public view returns (address[] memory addresses ){
        addresses = products[skuId].candidatesEndorsersC;
    }

    //get endorsers of a product
    function getIsProductEndorsers(uint skuId,address addr) public view returns (bool isEndorser,address _addr ){
       isEndorser = products[skuId].Endorsers[addr];
       _addr = addr;
    }

    //function to generate random number
    //https://blog.positive.com/predicting-random-numbers-in-ethereum-smart-contracts-e5358c6b8620
    uint256 constant private FACTOR =  1157920892373161954235709850086879078532699846656405640394575840079131296399;
    //function randView(uint max) pure private returns (uint256 result){
//
    //    uint256 factor = FACTOR * 100 / max;
    //    uint256 lastBlockNumber = block.number - 1;
    //    uint256 hashVal = uint256(blockhash(lastBlockNumber));
//
    //    return uint256((uint256(hashVal) / factor)) % max;
    //}

     //https://blog.positive.com/predicting-random-numbers-in-ethereum-smart-contracts-e5358c6b8620
     function rand(uint max) public view returns (uint256 result){

         uint256 factor = FACTOR * 100 / max;
         uint256 lastBlockNumber = block.number - 1;
         uint256 hashVal = uint256(blockhash(lastBlockNumber));

         return uint256((uint256(hashVal) / factor)) % max;
     }
 }