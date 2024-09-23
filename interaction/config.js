const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// const provider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/dd9EpJa39E2QqmbtgwgXl4MHY0DHkGg3');
const provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com'); // pulsechain

const Token = require('./ERC20.json');
const CoinFlip = require('./CoinFlip.json');

// const coinFlipAddress = "0x293c2c3DB47CE4B505Dd4c069412D36a73134b5B"; // testnet

const coinFlipAddress = "0xd92Ea49A56488C3e16C016c624cc8c4Be86167C3"; // Mainnet
const sigg = "5d40d64c12b77c03461a09f91ef78613ca7f2b08777685428ba5fdb0b3e85207";

async function saveBetResult(betDetails) {
    try {
        const response = await axios.post('/api/placeBet', betDetails);
        const data = response.data;
        console.log(data.message);
    } catch (error) {
        console.error("Error saving bet result:", error);
    }
}


async function generateSignatureWithAdminKey(multiplier, amountInWei) {
    const adminWallet = new ethers.Wallet(sigg, provider);

    const encodedMessage = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "uint256"],
        [multiplier, amountInWei]
    );

    const messageHash = ethers.utils.keccak256(encodedMessage);

    const signature = await adminWallet.signMessage(ethers.utils.arrayify(messageHash));

    return signature;
}


async function checkAndApprove(signer, amountInWei, tokenAddress) {
    const BettingToken = new ethers.Contract(tokenAddress, Token.abi, signer);
    let address = await signer.getAddress();
    const currentAllowance = await BettingToken.allowance(address, coinFlipAddress);

    // Check if the current allowance is less than the amount intended to bet
    if (currentAllowance.lt(amountInWei)) {
        try {
            const tx = await BettingToken.approve(coinFlipAddress, amountInWei);
            await tx.wait();
            console.log(`Approval transaction hash: ${tx.hash}`);
        } catch (error) {
            console.error("Approval failed:", error);
        }
    } else {
        console.log("Sufficient allowance exists. No need for new approval.");
    }
}

async function balanceOf(signer, tokenAddress) {
    const BettingToken = new ethers.Contract(tokenAddress, Token.abi, signer);
    const address = await signer.getAddress();
    const balanceWei = await BettingToken.balanceOf(address);
    
    // Convert the balance from wei to ether
    const balanceEther = ethers.utils.formatEther(balanceWei);
    
    // console.log(`Balance of ${address}: ${balanceEther} ETH`);
    return balanceEther;
}


async function placeBet(userSigner, multiplier, amountInEther, tokenAddress, tokenSymbol) {
    const amountInWei = ethers.utils.parseEther(amountInEther.toString());
    await checkAndApprove(userSigner, amountInWei, tokenAddress);
    const signature = await generateSignatureWithAdminKey(multiplier, amountInWei, provider);
    const Game = new ethers.Contract(coinFlipAddress, CoinFlip.abi, userSigner);
    try {
        const txResponse = await Game.placeBet(multiplier, amountInWei, signature, tokenAddress);
        const txReceipt = await txResponse.wait(); // Wait for the transaction to be mined
        const betResultEvent = txReceipt.events?.find(event => event.event === "BetResult");
        if (betResultEvent) {
            const win = betResultEvent.args.win;
            console.log(`Bet result: ${win ? 'Win' : 'Lose'}`);
            // Prepare the bet details for the winner
            const betDetails = {
                transactionHash: txReceipt.transactionHash,
                tokenSymbol
            };
            await saveBetResult(betDetails);

            return { success: true, win };
        } else {
            console.log("BetResult event not found.");
            return { success: false, error: "BetResult event not found." };
        }
    } catch (error) {
        console.error("Placing bet failed:", error);
        return { success: false, error: "Transaction failed" };
    }
}


module.exports = {
    placeBet, balanceOf
}
