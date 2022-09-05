const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
? describe.skip
: describe("Raffle Unit Tests", function (){
    let raffle, raffleContract, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, player, interval;
    const chainId = network.config.chainId;

    beforeEach(async function(){
        accounts = await ethers.getSigners() 
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        player = accounts[1]
        raffle = await ethers.getContract("Raffle", deployer);
        raffleContract = await ethers.getContract("Raffle") // Returns a new connection to the Raffle contract
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
    });

    // Ideally we make our tests have 1 assert per "it"`
    describe("constructor", function(){
        it("initializes the raffle correctly", async function(){
            const raffeState = await raffle.getRaffleState();
            
            assert.equal(raffeState.toString(), "0");
            assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        })
    });

    describe("enterRaffle", function(){
        it("reverts when you dont pay enough", async function(){
            await expect(raffle.enterRaffle()).to.be.revertedWith(
                "Raffle_NotEnoughETHEntered"
            )
        })

        it("records player when they enter", async function(){
            await raffle.enterRaffle({value: raffleEntranceFee})
            const playerFromContract = await raffle.getPlayer(0);
            assert.equal(playerFromContract, deployer);
        })

        it("emits event on enter", async function(){
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(
                raffle,
                "RaffleEnter"
            )
        })

        it("doesnt allow entrance when raffle is calculating", async function (){
            await raffle.enterRaffle({ value: raffleEntranceFee });
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            // We pretend to be a chainlink keeper
            await raffle.performUpkeep([]);

            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith(
                "Raffle__NotOpen"
            );

        })
    });

    describe("checkUpkeep", function(){
        it("returns false if people havent sent any ether", async function(){
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);

            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
            assert(!upkeepNeeded);
        });

        it("returns false if raffle isnt open", async function(){
            await raffle.enterRaffle({value: raffleEntranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            await raffle.performUpkeep([]);

            const raffleState = await raffle.getRaffleState();
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
            assert.equal(raffleState.toString(), "1");
            assert.equal(upkeepNeeded, false);
        });

        it("returns false if enough time hasn't passed", async () => {
            await raffle.enterRaffle({ value: raffleEntranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        });

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
            await raffle.enterRaffle({ value: raffleEntranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(upkeepNeeded)
        });
    })

    describe("performUpkeep", function(){
        it("it can only run if checkupkeep is true", async function(){
            await raffle.enterRaffle({value: raffleEntranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
            const tx = await raffle.performUpkeep([]);
            assert(tx);
        });

        it("reverts when checkUpkeep is false", async function(){
            await expect(raffle.performUpkeep([])).to.be.revertedWith(
                "Raffle__UpKeepNotNeeded"
            )
        });

        it("updates the raffle state, emits and event, and calls the vrf coordinator", async function(){
            await raffle.enterRaffle({value: raffleEntranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);

            const txResponse = await raffle.performUpkeep([]);
            const txReceipt = await txResponse.wait(1);
            const requestId = txReceipt.events[1].args.requestId;
            const raffleState = await raffle.getRaffleState();
            assert(requestId.toNumber() > 0);
            assert(raffleState.toString() == "1");
        })
    });

    describe("fulfillRandomWords", function(){
        beforeEach(async function(){
            await raffle.enterRaffle({value: raffleEntranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", []);
        });

        it("can only be called after performUpkeep", async function(){
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
            ).to.be.revertedWith("nonexistent request");
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
            ).to.be.revertedWith("nonexistent request");
        });

        // Big test
        // it("picks a winner, resets the lottery, and send money", async function(){
        //     const additionalEntrants = 3;
        //     const startingAccountIndex = 1; //deployer = 0
        //     const accounts = await ethers.getSigners()
            
        //     for(let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++){
        //         const accountConnectedRaffle = raffle.connect(accounts[i]);
        //         await accountConnectedRaffle.enterRaffle({value: raffleEntranceFee});
        //     }

        //     const startingTimeStamp = await raffle.getLastestTimeStamp();

        //     // performUpkeep (mock being chainlink keepers)
        //     // fulfillRandomWords (mock being the chainlink vrf)
        //     // We will have to wait for the fulfillRandomWords to be called
        //     await new Promise(async (resolve, reject)=>{
        //         raffle.once("WinnerPicked", async ()=>{
        //             console.log("Found the event!");
        //             try {
        //                 const recentWinner = await raffle.getRecentWinner();
        //                 console.log(recentWinner);
        //                 console.log(accounts[0].address);
        //                 console.log(accounts[1].address);
        //                 console.log(accounts[2].address);
        //                 console.log(accounts[3].address);
        //                 const raffleState = await raffle.getRaffleState();
        //                 const endingTimeStamp = await raffle.getLastestTimeStamp();
        //                 const numPlayers = await raffle.getNumberOfPlayers();
        //                 assert.equal(numPlayers.toString(), "0");
        //                 assert.equal(raffleState.toString(), "0");
        //                 assert.equal(endingTimeStamp > startingTimeStamp);
        //             } catch (error) {
        //                 reject(e);
        //             }
        //             resolve();
        //         });
        //         // setting up the listener

        //         // below, we will fire the event, and the listener will pick it up and resolve
        //         const tx = await raffle.performUpkeep([]);
        //         const txReceipt = await tx.wait(1);
        //         await vrfCoordinatorV2Mock.fulfillRandomWords(
        //             txReceipt.events[1].args.requestId,
        //             raffle.address
        //         );
                
        //     });

        // });


            // This test is too big...
            // This test simulates users entering the raffle and wraps the entire functionality of the raffle
            // inside a promise that will resolve if everything is successful.
            // An event listener for the WinnerPicked is set up
            // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
            // All the assertions are done once the WinnerPicked event is fired
            it("picks a winner, resets, and sends money", async () => {
                const additionalEntrances = 3 // to test
                const startingIndex = 2
                for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) { // i = 2; i < 5; i=i+1
                    raffle = raffleContract.connect(accounts[i]) // Returns a new instance of the Raffle contract connected to player
                    await raffle.enterRaffle({ value: raffleEntranceFee })
                }
                const startingTimeStamp = await raffle.getLastestTimeStamp() // stores starting timestamp (before we fire our event)

                // This will be more important for our staging tests...
                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
                        console.log("WinnerPicked event fired!")
                        // assert throws an error if it fails, so we need to wrap
                        // it in a try/catch so that the promise returns event
                        // if it fails.
                        try {
                            // Now lets get the ending values...
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerBalance = await accounts[2].getBalance()
                            const endingTimeStamp = await raffle.getLastestTimeStamp()
                            await expect(raffle.getPlayer(0)).to.be.reverted
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[2].address)
                            assert.equal(raffleState, 0)
                            assert.equal(
                                winnerBalance.toString(), 
                                startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                    .add(
                                        raffleEntranceFee
                                            .mul(additionalEntrances)
                                            .add(raffleEntranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve() // if try passes, resolves the promise 
                        } catch (e) { 
                            reject(e) // if try fails, rejects the promise
                        }
                    })

                    // kicking off the event by mocking the chainlink keepers and vrf coordinator
                    const tx = await raffle.performUpkeep("0x")
                    const txReceipt = await tx.wait(1)
                    const startingBalance = await accounts[2].getBalance()
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        raffle.address
                    )
                })
            })
    })
})