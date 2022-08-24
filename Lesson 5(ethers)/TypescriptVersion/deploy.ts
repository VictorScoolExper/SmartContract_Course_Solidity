// synchronous [solidity]: executes each function one by one
// asynchronous [javascript]: executes multiple functions at once

// Promise states
// Pending
// Fufilled
// Rejected

import { ethers } from 'ethers';
import * as fs from "fs-extra";
import "dotenv/config";

async function main() {
  // compile them in our code 
  // compile them separately
  // HTTP://127.0.0.1:7545
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);

  const wallet = new ethers.Wallet( process.env.PRIVATE_KEY!,  provider ); // use the .env

  // The next section was created to ensure private key safetly
  // const encryptedJson = fs.readFileSync("./.encryptedKey.json", "utf8");
  // let wallet = new ethers.Wallet.fromEncryptedJsonSync(
  //   encryptedJson, 
  //   process.env.PRIVATE_KEY_PASSWORD
  // );// new walled created with the hashed private key.
  // wallet = await wallet.connect(provider);

  const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8"); // Reads file and the type of coding it uses
  const binary = fs.readFileSync(
    "./SimpleStorage_sol_SimpleStorage.bin", 
    "utf8"
  );
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet); //
  console.log("Deploying please wait");
  const contract = await contractFactory.deploy(); // contract deploying, we can add override 
   // console.log(contract); // note: deploy cmd is, node deploy.js
  await contract.deployTransaction.wait(1); // waits one block confirmation
  
  console.log(`Contract Address: ${contract.address}`);

  // console.log("Let's deploy with only transaction data!");
  // const nonce = await wallet.getTransactionCount();
  // const tx = {
  //   nonce: nonce,
  //   gasPrice: 20000000000,
  //   gasLimit: 1000000,
  //   to: null,
  //   value: 0,
  //   data: "0x608060405234801561001057600080fd5b50610777806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80632e64cec11461005c5780636057361d1461007a5780636f760f41146100965780638bab8dd5146100b25780639e7a13ad146100e2575b600080fd5b610064610113565b6040516100719190610530565b60405180910390f35b610094600480360381019061008f9190610473565b61011c565b005b6100b060048036038101906100ab9190610417565b610126565b005b6100cc60048036038101906100c791906103ce565b6101bc565b6040516100d99190610530565b60405180910390f35b6100fc60048036038101906100f79190610473565b6101ea565b60405161010a92919061054b565b60405180910390f35b60008054905090565b8060008190555050565b6000604051806040016040528083815260200184815250905060028190806001815401808255809150506001900390600052602060002090600202016000909190919091506000820151816000015560208201518160010190805190602001906101919291906102a6565b505050816001846040516101a59190610519565b908152602001604051809103902081905550505050565b6001818051602081018201805184825260208301602085012081835280955050505050506000915090505481565b600281815481106101fa57600080fd5b906000526020600020906002020160009150905080600001549080600101805461022390610644565b80601f016020809104026020016040519081016040528092919081815260200182805461024f90610644565b801561029c5780601f106102715761010080835404028352916020019161029c565b820191906000526020600020905b81548152906001019060200180831161027f57829003601f168201915b5050505050905082565b8280546102b290610644565b90600052602060002090601f0160209004810192826102d4576000855561031b565b82601f106102ed57805160ff191683800117855561031b565b8280016001018555821561031b579182015b8281111561031a5782518255916020019190600101906102ff565b5b509050610328919061032c565b5090565b5b8082111561034557600081600090555060010161032d565b5090565b600061035c610357846105a0565b61057b565b9050828152602081018484840111156103785761037761070a565b5b610383848285610602565b509392505050565b600082601f8301126103a05761039f610705565b5b81356103b0848260208601610349565b91505092915050565b6000813590506103c88161072a565b92915050565b6000602082840312156103e4576103e3610714565b5b600082013567ffffffffffffffff8111156104025761040161070f565b5b61040e8482850161038b565b91505092915050565b6000806040838503121561042e5761042d610714565b5b600083013567ffffffffffffffff81111561044c5761044b61070f565b5b6104588582860161038b565b9250506020610469858286016103b9565b9150509250929050565b60006020828403121561048957610488610714565b5b6000610497848285016103b9565b91505092915050565b60006104ab826105d1565b6104b581856105dc565b93506104c5818560208601610611565b6104ce81610719565b840191505092915050565b60006104e4826105d1565b6104ee81856105ed565b93506104fe818560208601610611565b80840191505092915050565b610513816105f8565b82525050565b600061052582846104d9565b915081905092915050565b6000602082019050610545600083018461050a565b92915050565b6000604082019050610560600083018561050a565b818103602083015261057281846104a0565b90509392505050565b6000610585610596565b90506105918282610676565b919050565b6000604051905090565b600067ffffffffffffffff8211156105bb576105ba6106d6565b5b6105c482610719565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600081905092915050565b6000819050919050565b82818337600083830152505050565b60005b8381101561062f578082015181840152602081019050610614565b8381111561063e576000848401525b50505050565b6000600282049050600182168061065c57607f821691505b602082108114156106705761066f6106a7565b5b50919050565b61067f82610719565b810181811067ffffffffffffffff8211171561069e5761069d6106d6565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b610733816105f8565b811461073e57600080fd5b5056fea264697066735822122077626834b426099ad9730f30441b70b6d1770f8a98d0264bded5fc1d20117bc664736f6c63430008070033",
  //   chainId: 1337,
  // }; //transaction
  // const sentTxResponse = await wallet.sendTransaction(tx); // This function signs transaction first then sends transaction
  // await sentTxResponse.wait(1);
  // console.log(sentTxResponse);

  // Get Number
  const currentFavoriteNumber = await contract.retrieve();
  console.log(`Current Favorite Number: ${currentFavoriteNumber.toString()}`); // ``: these are bantics
  const transactionResponse = await contract.store("7"); // pass variables to contract function as strings
  const transactionReceipt = await transactionResponse.wait(1);
  const updatedFavoriteNumber = await contract.retrieve();
  console.log(`Updated favorite number is: ${updatedFavoriteNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


// yarn solcjs --bin --abi --include-path node_modules/ --base-path . -o . SimpleStorage.sole