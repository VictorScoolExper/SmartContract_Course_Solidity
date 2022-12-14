// Raffle 
// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every x minutes -> completly automate
// Chainlink Oracle -> Randomness, Automated Execution (Chainlin Keepers)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle_NotEnoughETHEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpKeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/** @title A sample raffle contract
 * @author Victor
 * @notice This contract is for creating an untamperable decentralized smart contracts
 * @dev This implements Chainlink VRF V2 and Chainlink Keeper 
 * 
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface{
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    } // uint256 0=OPEN, 1=CALCULATING

    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2, // Address needed for mock
        uint256 entranceFee, 
        bytes32 gasLane,
        uint64 susbcriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2){
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = susbcriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        //require msg.value > i_entranceFee
        if(msg.value < i_entranceFee){ 
            revert Raffle_NotEnoughETHEntered(); 
        }
        if(s_raffleState != RaffleState.OPEN){
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        // Events: get emitted when we update a dynamic array or mapping
        // Indexed parameters: you can index up to 3
        // Named events with the function name backwards
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is a function that the chainlink keeper nodes call
     * they look for the `upkeepNeeded` to return true.
     * The following should be true in order to return true
     * 1. Our time interval should have passed
     * 2. The lottery should have at least 1 player, and have some eth
     * 3. Our subscription is funded with LINK
     * 4. The lottery should be in an "open" state.
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    ) 
        public 
        override 
        returns (
            bool upkeepNeeded, 
            bytes memory /*performData*/
        ) 
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    /**
     * @dev 
     * This performUpkeep replaces the previous function of requestRandomWinner()
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override{
        (bool upkeepNeeded, ) = checkUpkeep("");
        if(!upkeepNeeded){
            revert Raffle__UpKeepNotNeeded(
                address(this).balance, 
                s_players.length, 
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }
    // the next function inherits function
    function fulfillRandomWords(
        uint256 , //requestId
        uint256[] memory randomWords
    ) 
        internal 
        override 
    {
        // s_players size 10
        // randomNumber 202
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinnner = s_players[indexOfWinner];
        s_recentWinner = recentWinnner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success,) = recentWinnner.call{value: address(this).balance}("");
        // require(success)
        if(!success){
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinnner);
    }

    /* View / Pure functions */
    function getEntranceFee() public view returns (uint256){
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address){
        return s_players[index];
    }

    function getRecentWinner() public view returns (address){
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    // pure is used instead of view becuase it returns a single digit
    function getNumWords() public pure returns (uint256){
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns(uint256){
        return s_players.length;
    }

    function getLastestTimeStamp () public view returns (uint256){
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns(uint256){
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256){
        return i_interval;
    }
}