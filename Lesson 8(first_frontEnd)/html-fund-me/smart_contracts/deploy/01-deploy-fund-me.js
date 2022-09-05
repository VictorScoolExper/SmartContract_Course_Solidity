// THis uses hardhat-deploy

// function deployFunc(){
//     console.log("hello")
// }
// module.exports.default = deployFunc;

const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const {verify} = require("../utils/verify");

module.exports = async ({getNamedAccounts, deployments})=>{
    //const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if(chainId === 31337){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")

    // Mock contract for our local testing
    
    // What happens when we want to change chains?
    // When going for localhost or hardhat network we want to use mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,// put price feed address
        log: true,
        waitConfirmations:  network.config.blockConfirmations || 1,
    });
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        await verify(fundMe.address, args);
    }
}
module.exports.tags = ["all", "fundme"];