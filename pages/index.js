import Link from "next/link";
import { Button } from "@/components/Button";
import Image from 'next/image';
import ConnectButton from "@/components/ConnectButton";
import useSigner, { SignerProvider } from '@/state/signer';
import { useState, useEffect } from 'react';
import Footer from "@/components/Footer";
import { placeBet, balanceOf } from '../interaction/config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WinnersList from "@/components/WinnersList";

export default function Home() {
    const { signer } = useSigner();
    const [walletConnected, setWalletConnected] = useState(false);
    const [amountInputError, setAmountInputError] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedMultiplier, setSelectedMultiplier] = useState(2);
    const [selectedCoinSide, setSelectedCoinSide] = useState('Heads');
    const [currentBalance, setCurrentBalance] = useState(0); // Replace with actual wallet balance
    const [enteredAmount, setEnteredAmount] = useState('');
    const [winningAmount, setWinningAmount] = useState(0);
    const [isBalanceInsufficient, setIsBalanceInsufficient] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'rules' or 'details'
    const [showWinners, setShowWinners] = useState(false);
    const [selectedToken, setSelectedToken] = useState('Voodoo');
    const [tokenAddress, setTokenAddress] = useState('0x1c5f8e8E84AcC71650F7a627cfA5B24B80f44f00'); // Mainnet
    // const [tokenAddress, setTokenAddress] = useState('0x62E58175E472803596b891356888FdC7D352c212'); // Testing
    const [tokenSymbol, setTokenSymbol] = useState('VDO');
    const [coinImage, setCoinImage] = useState('/spincoinv1.gif'); // Default image when the user comes to the website

    // Define your tokens and their properties 
    const tokens = [
        // { name: "Voodoo", image: "/0x0.png", address: "0x62E58175E472803596b891356888FdC7D352c212", symbol: "VDO" }, // Test token on mumbai
        { name: "Voodoo", image: "/0x0.png", address: "0x1c5f8e8E84AcC71650F7a627cfA5B24B80f44f00", symbol: "VDO" }, // mainnet one
        { name: "Magic", image: "/hat.png", address: "0xd63b9d8d6e38cb7fbfdceede3ce92f97f5aea7ac", symbol: "MAGIC" },
        { name: "Poison", image: "/poison.png", address: "0xb8c8761fed2aad5c0a75561bc604531a42c452e6", symbol: "POISON" },
    ];

    useEffect(() => {
        if (signer === undefined) {
            setWalletConnected(false);
        } else {
            setWalletConnected(true);
            signer.getAddress().then(address => {
                setWalletAddress(address);
                // Get the balance of the connected user
                balanceOf(signer, tokenAddress).then(balance => setCurrentBalance(balance));

                console.log("currentBalance: ", currentBalance)
            });
        }
    }, [signer, tokenAddress]);

    useEffect(() => {
        if (signer === undefined) {
            setWalletConnected(false);
        } else {
            setWalletConnected(true);
            signer.getAddress().then(address => setWalletAddress(address));
        }
    }, [signer]);

    const handleAmountChange = (e) => {
        const amount = e.target.value;
        setEnteredAmount(amount);

        if (amount > currentBalance) {
            setIsBalanceInsufficient(true);
            setWinningAmount(0);
        } else {
            setIsBalanceInsufficient(false);
            if (selectedMultiplier) {
                setWinningAmount(amount * selectedMultiplier);
            }
        }
    };

    const handleMultiplierClick = (multiplier) => {
        setSelectedMultiplier(multiplier);
        if (enteredAmount && enteredAmount <= currentBalance) {
            setWinningAmount(enteredAmount * multiplier);
        }
    };

    const handleCoinSideClick = (side) => {
        setSelectedCoinSide(side);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleStartGame = async () => {
        console.log('Game is starting...');

        // Check if the amount is empty and set error state accordingly
        if (enteredAmount.trim() === '') {
            setAmountInputError(true);
            return; // Stop the function execution if no amount is entered
        } else {
            setAmountInputError(false); // Reset error state if the check passes
        }

        if (!walletConnected || !selectedMultiplier || isBalanceInsufficient) {
            console.error("Please check your wallet connection, selected multiplier, and ensure sufficient balance.");
            return;
        }

        setCoinImage('/spincoinv2.gif');

        try {
            const { success, win } = await placeBet(signer, selectedMultiplier, enteredAmount, tokenAddress, tokenSymbol);
            balanceOf(signer, tokenAddress).then(balance => setCurrentBalance(balance));

            const oppositeSide = selectedCoinSide === 'Heads' ? 'Tails' : 'Heads'; // Determine the opposite side

            if (success && win) {
                setCoinImage((selectedCoinSide === 'Heads' ? '/heads.png' : '/tails.png'))
                toast.success(`${selectedCoinSide}! Congratulations, you won!`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })

                // After 5 seconds, switch back to spincoinv1 image
                setTimeout(() => {
                    setCoinImage('/spincoinv1.gif');
                }, 5000);

            } else if (success && !win) {
                setCoinImage((selectedCoinSide === 'Heads' ? '/tails.png' : '/heads.png'));
                toast.error(`${oppositeSide}! Sorry, you lost. Try again?`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })

                // After 5 seconds, switch back to spincoinv1 image
                setTimeout(() => {
                    setCoinImage('/spincoinv1.gif');
                }, 5000);

            } else {
                // Show error toast with the specific error message
                setCoinImage('/spincoinv1.gif'); // Reset to spincoinv1 on error
                toast.error('There was an error placing your bet. Please try again.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } catch (error) {
            console.error("Failed to place bet:", error);
            setCoinImage('/spincoinv1.gif'); // Reset to spincoinv1 on error

            // Check if the error is a transaction failure
            if (error.code === "CALL_EXCEPTION") {
                toast.error('Transaction failed. Please try again.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('There was an error placing your bet. Please try again.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        }
    };

    return (

        <main key="1" className="flex flex-col justify-between min-h-screen from-gray-100 via-gray-200 to-gray-300">

            <header className="flex items-center justify-between py-4 px-5 bg-green-950 text-white z-10">
                <h1 className="text-2xl font-bold">Coinflip DApp</h1>
                <SignerProvider>
                    <ConnectButton />
                </SignerProvider>
            </header>

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            {walletConnected ? (
                <section className="relative flex-grow flex items-center justify-center bg-gray-300 w-full px-4 py-8 sm:py-12">
                {/* Background Image Container */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/l2.jpg"
                    alt="Background Image"
                    layout="fill"
                    objectFit="cover" // Cover the container without stretching
                    objectPosition="center" // Center the image within the container
                    quality={100} // Adjust quality if needed
                    className="transition-opacity duration-500 ease-in-out" // Optional: Add transition effects
                  />
                </div>


                    <div className="text-center max-w-2xl mx-auto bg-black bg-opacity-50 px-2 sm:px-4 z-10 my-2 rounded-lg">

                        <h2 className="mt-4 animate-pulse text-4xl font-bold mb-4 text-green-500">Ready to flip the coin?</h2>

                        <div className="mb-2">
                            <h3 className="font-bold text-md mt-4 mb-2 text-white underline">Choose Token</h3>
                            <div className="flex space-x-4 justify-center">
                                {tokens.map((token) => (
                                    <button
                                        key={token.name}
                                        onClick={() => {
                                            setSelectedToken(token.name);
                                            setTokenAddress(token.address);
                                            setTokenSymbol(token.symbol);
                                        }}
                                        className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${selectedToken === token.name ? '' : 'grayscale hover:grayscale-0'} transition duration-300`}
                                    >
                                        <img
                                            src={token.image}
                                            alt={token.name}
                                            className={`max-w-full max-h-full object-contain transition duration-300 ${selectedToken === token.name ? 'scale-90' : 'scale-75 hover:scale-90'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 mx-auto mb-4">
                            <h3 className="font-bold text-md mb-2 text-white underline">Enter Your Bet Amount</h3>
                            <input
                                className={`px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline w-full ${amountInputError ? 'error-input' : 'border-gray-300'}`}
                                placeholder="Enter amount"
                                type="number"
                                value={enteredAmount}
                                onChange={handleAmountChange}
                                onFocus={() => setAmountInputError(false)} // Reset error state when the user focuses on the input
                            />
                            {amountInputError && <p className="error-message">Please enter an amount</p>}

                            {isBalanceInsufficient && <p className="text-red-500">Insufficient balance</p>}
                        </div>

                        <div className="mb-2">
                            <h3 className="font-bold text-md mt-4 mb-2 text-white underline">Choose Your Multiplier</h3>
                            <div className="flex space-x-4 justify-center">
                                <Button
                                    className={`font-bold py-2 px-4 rounded ${selectedMultiplier === 2 ? 'bg-green-950' : 'bg-gray-400'}`}
                                    onClick={() => handleMultiplierClick(2)}
                                >
                                    x2
                                </Button>
                                <Button
                                    className={`font-bold py-2 px-4 rounded ${selectedMultiplier === 3 ? 'bg-green-950' : 'bg-gray-400'}`}
                                    onClick={() => handleMultiplierClick(3)}
                                >
                                    x3
                                </Button>
                                <Button
                                    className={`font-bold py-2 px-4 rounded ${selectedMultiplier === 4 ? 'bg-green-950' : 'bg-gray-400'}`}
                                    onClick={() => handleMultiplierClick(4)}
                                >
                                    x4
                                </Button>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-md mt-4 mb-2 text-white underline">Select Heads or Tails</h3>
                                <div className="flex space-x-4 justify-center">
                                    <Button
                                        className={`font-bold py-2 px-4 rounded text-xl w-32 ${selectedCoinSide === 'Heads' ? 'bg-green-950' : 'bg-gray-400'}`}
                                        onClick={() => handleCoinSideClick('Heads')}
                                    >
                                        Heads
                                    </Button>
                                    <Button
                                        className={`font-bold py-2 px-4 rounded text-xl w-32 ${selectedCoinSide === 'Tails' ? 'bg-green-950' : 'bg-gray-400'}`}
                                        onClick={() => handleCoinSideClick('Tails')}
                                    >
                                        Tails
                                    </Button>

                                </div>
                            </div>

                        </div>

                        <div className="relative mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-950 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out text-white">
                                    <h3 className="font-semibold text-xl mb-2 underline decoration-white decoration-2 underline-offset-4">Current Balance</h3>
                                    <p className="text-lg font-light">{currentBalance} {tokenSymbol}</p>
                                </div>
                                <div className="bg-black p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out text-white">
                                    <h3 className="font-semibold text-xl mb-2 underline decoration-white decoration-2 underline-offset-4">Winning Amount</h3>
                                    <p className="text-lg font-light">{winningAmount} {tokenSymbol}</p>
                                </div>
                            </div>

                            {/* Coin Display */}
                            <div className="flex justify-center items-center mt-4 mb-4">
                                <img src={coinImage} alt="Coin" className="w-40 h-40" />
                            </div>

                            {/* Start Game Button */}
                            <div className="text-center">
                                <Button className="bg-gray-400 hover:bg-green-950 text-white font-bold py-2 px-4 rounded mt-4"
                                    onClick={handleStartGame}>
                                    Start Game
                                </Button>
                            </div>
                        </div>


                        <div className="flex flex-col items-center justify-center mt-4">
                            <button
                                onClick={() => setShowWinners(true)}
                                className="underline text-gray-300 hover:text-white transition-colors"
                            >
                                List of Recent Winners
                            </button>
                            <WinnersList show={showWinners} onClose={() => setShowWinners(false)} />
                        </div>


                        <div className="mt-8 mb-8 bg-white p-4 rounded-lg shadow-lg text-black">
                            <div className="flex justify-center space-x-4 mb-4">
                                <button
                                    className={`font-semibold text-lg ${activeTab === 'details' ? 'underline decoration-green-500' : ''}`}
                                    onClick={() => handleTabChange('details')}
                                >
                                    CoinFlip Challenge
                                </button>
                                <button
                                    className={`font-semibold text-lg ${activeTab === 'rules' ? 'underline decoration-green-500' : ''}`}
                                    onClick={() => handleTabChange('rules')}
                                >
                                    Game Rules
                                </button>

                            </div>

                            <div className="tab-content">
                                {activeTab === 'details' && (
                                    <div className="tab-pane h-48 overflow-y-auto p-4">
                                        <h3 className="font-bold text-lg mb-2">CoinFlip Challenge</h3>
                                        <p>
                                            Take a chance and predict whether the coin will land on 'Heads' or 'Tails' Make your choice and double your bet if luck is on your side. Simple, thrilling, and instant payouts for the ultimate crypto gambling game!
                                        </p>
                                        <div className="flex justify-center">
                                            <img src="/sign.png" alt="Signature" className="w-auto h-20 mt-0"></img>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'rules' && (
                                    <div className="tab-pane h-48 overflow-y-auto p-4">
                                        <h3 className="font-bold text-lg mb-2">Game Rules</h3>
                                        <ul className="list-disc list-inside">
                                            <li>Enter an amount you wish to bet.</li>
                                            <li>Select a multiplier (x2, x3, or x4) to potentially increase your winnings.</li>
                                            <li>Be aware that using multiplier buttons decreases the chance of winning.</li>
                                            <li>Choose 'Heads' or 'Tails' for the coin flip.</li>
                                            <li>Click 'Start Game' to commence the coin flip.</li>
                                            <li>If the coin lands on your chosen side and you've met the bet criteria, you win the multiplied amount.</li>
                                            <li>If the coin lands on the opposite side, you lose your bet.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </section>
            ) : (

                <section className="flex-grow flex items-center justify-center bg-gray-300 w-full relative px-4 py-8 sm:py-12">
                    <Image
                        src="/l2.jpg"
                        alt="Background Image"
                        fill
                        style={{ zIndex: 0 }}
                    />

                    <div className="text-center max-w-2xl mx-auto bg-black bg-opacity-50 px-2 sm:px-4 z-10 my-2 rounded-lg p-5">
                        <h2 className="mt-4 text-4xl font-bold mb-4 text-white">Please Connect Wallet</h2>
                        <p>To start playing, please connect your wallet.</p>
                    </div>
                </section>
            )}

            <Footer></Footer>
        </main>
    );
}
