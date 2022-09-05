// nodejs uses: require
// front-end js: uses import
import { ethers } from "./ethers-5.6.esm.min.js";
import {abi, contractAddress} from './constants.js';

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

console.log(ethers);

async function connect(){
    if(typeof window.ethereum !== "undefined"){
        try {
            await window.ethereum.request({method: "eth_requestAccounts"});
        } catch (error) {
            console.log(error);
        }
        connectButton.innerHTML = "Connected!!";
        
    } else {
        connectButton.innerHTML = "Please install metamask";
    }
}

async function getBalance(){
    if(typeof window.ethereum != "undefined"){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(contractAddress);
        console.log(ethers.utils.formatEther(balance));
    }
}

// fund function
async function fund(){
    const ethAmount = document.getElementById("ethAmount").value;
    console.log(`Funding with ${ethAmount}...`);
    if(typeof window.ethereum !== "undefined"){
        // provider / connection to the blockchain
        const provider = new ethers.providers.Web3Provider(window.ethereum); // Looks at meta-mask, to find provider
        // signer / walllet / someone with some gas
        const signer = provider.getSigner();
        console.log(signer);
        // contract that we are interacting with
        // ^ABI & Address
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const transcationResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount)
            });
            await listenForTransactionMine(transcationResponse, provider);
        } catch (error) {
            console.log(error);
        }
        
        
    }
}

function listenForTransactionMine(transcationResponse, provider){
    console.log(`Mining ${transcationResponse.hash}....`);
    // listen for transaction to finish
    return new Promise((resolve, reject)=>{
        provider.once(transcationResponse.hash, (transactionReceipt)=>{
            console.log(`Completed with ${transactionReceipt.confirmations} confirmations`);
            resolve();
        });
    })
    
}

// withdraw
async function withdraw (){
    if(typeof window.ethereum != "undefined"){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const transcationResponse = await contract.withdraw();
            await listenForTransactionMine(transcationResponse, provider);
        } catch (error) {
            console.log(error);
        }
    }
}