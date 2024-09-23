import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Web3Modal from "web3modal";

type SignerContextType = {
  signer?: JsonRpcSigner;
  address?: string;
  loading: boolean;
  connectWallet: () => Promise<void>;
};

const SignerContext = createContext<SignerContextType>({} as any);
const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: React.ReactNode }) => {
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [address, setAddress] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const switchToPulseChain = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x171', // PulseChain chain ID in hexadecimal
          chainName: 'PulseChain',
          nativeCurrency: {
            name: 'Pulse',
            symbol: 'PLS',
            decimals: 18
          },
          rpcUrls: ['https://rpc.pulsechain.com'],
          blockExplorerUrls: ['https://scan.pulsechain.com']
        }],
      });
    } catch (switchError) {
      console.error('Failed to switch to PulseChain:', switchError);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      const web3modal = new Web3Modal({ cacheProvider: true });
      const instance = await web3modal.connect();
      const provider = new Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const chainId = await signer.getChainId();
      if (chainId !== 369) {
        await switchToPulseChain();
      }
      setSigner(signer);
      setAddress(address);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [switchToPulseChain]);

  useEffect(() => {
    const web3Modal = new Web3Modal();
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
    // Listen for account changes and chain changes
    window.ethereum?.on("accountsChanged", connectWallet);
    window.ethereum?.on("chainChanged", switchToPulseChain);

    return () => {
      window.ethereum?.removeListener("accountsChanged", connectWallet);
      window.ethereum?.removeListener("chainChanged", switchToPulseChain);
    };
  }, [connectWallet, switchToPulseChain]);

  const contextValue = { signer, address, loading, connectWallet };

  return <SignerContext.Provider value={contextValue}>{children}</SignerContext.Provider>;
};

export default useSigner;
