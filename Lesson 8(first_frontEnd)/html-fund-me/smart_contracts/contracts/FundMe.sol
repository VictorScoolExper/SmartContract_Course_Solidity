// SPDX-License-Identifier: MIT

// Get funds from users
// Withdraw funds
// Set a minimum funding value in USD

pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error FundMe__NotOwner();


/** @title A contract for a crowd funding
 *  @author Victor Martinez
 *  @notice This contract is to demo sample funding contract
 *  @dev This implements price feed as our library
 */
contract FundMe {
    //Type declaractions
    using PriceConverter for uint256;

    // state variables
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    // using constant saves us gas.
    uint256 public constant MINIMUM_USD = 50 * 1E18; // CONVERT TO ETH
    AggregatorV3Interface private s_priceFeed;

    // then have modifers
    modifier onlyOwner {
        if(msg.sender != i_owner){ revert FundMe__NotOwner(); } 
        _;
    }

    constructor(address priceFeedAddress){
        i_owner = msg.sender; // the sender is the person that deployed contract
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /** 
     *  @notice This function funds this contract
     *  @dev This implements price feed as our library
    */
    // payable makes it able to hold funds.
    function fund() public payable{
        require( msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "Didnt send engough"); // 1e18 == 1 * 10 ** 18 == 1000000000000000000
        // 18 decimals places
        s_funders.push(msg.sender); // msg.sender is the address of the sender
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for( uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++ ){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        //reset the array
        s_funders = new address[](0);

        // call
        (bool callSuccess, /* bytes memory dataReturned */) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call Failed");
       
    }

    function cheaperWithdraw() public payable onlyOwner{
        address[] memory funders = s_funders;
        // mapping cannot be in memory
        for(uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns(address){
        return i_owner;
    }
    function getFunder(uint256 index) public view returns(address){
        return s_funders[index];
    }
    function getAddressToAmountFunded(address funder) public view returns(uint256){
        return s_addressToAmountFunded[funder];
    }
    function getPriceFeed() public view returns(AggregatorV3Interface){
        return s_priceFeed;
    }
}