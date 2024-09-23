// pages/api/winners.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const betsFile = path.join(process.cwd(), 'data', 'winners.json');

  try {
    const data = fs.readFileSync(betsFile, 'utf8');
    const winners = JSON.parse(data);

    // Send the winners data
    res.status(200).json(winners);
  } catch (error) {
    res.status(500).json({ message: 'Error reading winners data', error: error.message });
  }
}
