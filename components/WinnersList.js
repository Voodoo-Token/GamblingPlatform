import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

function WinnersList({ show, onClose }) {
    const [winners, setWinners] = useState([]);

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const res = await fetch('/api/winners');
                const data = await res.json();
                console.log(data); // Add this line

                if (data && Array.isArray(data)) {
                    setWinners(data);
                } else {
                    console.error('Fetched data is not an array:', data);
                }
            } catch (error) {
                console.error('Failed to fetch winners:', error);
            }
        };

        fetchWinners();
    }, []);

    useEffect(() => {
        let scrollStep = 2; // Pixels to scroll
        const interval = setInterval(() => {
            const container = document.getElementById('winnersListContainer');
            if (container) {
                let newScrollPosition = container.scrollTop + scrollStep;
                if (newScrollPosition >= container.scrollHeight - container.offsetHeight) {
                    container.scrollTop = 0; // Reset scroll to start if end reached
                } else {
                    container.scrollTop = newScrollPosition;
                }
            }
        }, 50); // Adjust for smoother scrolling, decrease for faster scrolling

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [winners]);

    // Filter for wins, reverse for recent first, and take last 10
    const latestWinners = Array.isArray(winners) ? winners
        .filter(winner => winner.win)
        .reverse()
        .slice(-10)
        : [];

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-center items-center" onClick={onClose}>
            <div className="bg-black bg-opacity-50 rounded-lg shadow-lg p-5 max-w-2xl w-full relative overflow-hidden" style={{ maxHeight: '60vh' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-0 right-0 m-2 text-2xl text-white bg-transparent rounded-full p-1">&times;</button>
                <h2 className="text-lg font-semibold mb-4 text-center text-white">Latest 10 Winners</h2>
                <ul id="winnersListContainer" className="space-y-2 overflow-hidden" style={{ maxHeight: '50vh' }}>
                    {latestWinners.map((winner, index) => (
                        <li key={index} className="bg-black text-white p-4 rounded shadow mx-2">
                            <p><strong>Address:</strong> {winner.player}</p>
                            <p><strong>Amount Won:</strong> {parseFloat(ethers.utils.formatEther(winner.amountWon)).toFixed(2)} {winner.tokenSymbol}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default WinnersList;
