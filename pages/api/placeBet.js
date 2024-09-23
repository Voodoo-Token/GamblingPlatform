// /api/placeBet.js
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const betsFile = path.join(process.cwd(), 'data', 'winners.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { transactionHash, tokenSymbol } = req.body;
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com'); // pulsechain
// const provider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/dd9EpJa39E2QqmbtgwgXl4MHY0DHkGg3'); // mumbai

  try {
    const txReceipt = await provider.waitForTransaction(transactionHash);
    const CoinFlip = new ethers.utils.Interface([
      "event BetResult(address indexed player, bool win, uint256 amountWon)"
    ]);
    const eventTopic = CoinFlip.getEventTopic("BetResult");

    const betResultEvent = txReceipt.logs.find(log => log.topics.includes(eventTopic));

    if (betResultEvent) {
      const decodedData = CoinFlip.decodeEventLog("BetResult", betResultEvent.data, betResultEvent.topics);
      const { player, win, amountWon, symbol } = decodedData;

      let winners;
      try {
        winners = fs.existsSync(betsFile) ? JSON.parse(fs.readFileSync(betsFile, 'utf-8')) : [];
      } catch (error) {
        console.error("Failed to parse winners.json, initializing as empty array.", error);
        winners = [];
      }

      winners.push({ player, win, amountWon: amountWon.toString(), transactionHash, tokenSymbol });
      fs.writeFileSync(betsFile, JSON.stringify(winners, null, 2));

      return res.status(200).json({ message: 'Bet processed successfully', player, win, amountWon, tokenSymbol });
    } else {
      return res.status(404).json({ error: "BetResult event not found in the transaction receipt." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Error processing bet", details: error.message });
  }
}
