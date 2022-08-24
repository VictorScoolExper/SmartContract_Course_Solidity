import { task } from "hardhat/config";

export default task("block-number", "Print the current block number").setAction(
    // hre: hardhar runtime enviroment, this enables it to use packages
    async (taskArgs, hre)=>{
        const blockNumber = await hre.ethers.provider.getBlockNumber();
        console.log(`current block number: ${blockNumber}`);
    }
)
