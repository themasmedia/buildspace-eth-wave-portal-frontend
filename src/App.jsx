// require('dotenv').config();

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

function App() {

  const [currentAccount, setCurrentAccount] = useState('');
  const [allWaves, setAllWaves] = useState([]);
  const [totalWaves, setTotalWaves] = useState(0);
  const [textInput, setTextInput] = useState('');

  const contractAddress = '0xA1da37d426aF5Db39C78200e672DDb4c9D0Fe35d';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {

    try {
      const { ethereum } = window;
  
      if (!ethereum) {
        console.log('Make sure you have Metamask');
      } else {
        console.log('We have the Ethereum object', ethereum);
      }
  
      const accounts = await ethereum.request({ method: 'eth_accounts' });
  
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }

  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      let defaultProvider = new ethers.getDefaultProvider('rinkeby');
      let wavePortalContract = new ethers.Contract(contractAddress, contractABI, defaultProvider);
      let allWaves = await wavePortalContract.getAllWaves();

      let wavesCleaned = [];
      allWaves.forEach(
        wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          })
        }
      )
      setAllWaves(wavesCleaned);
    } catch (error) {
      console.log(error);
    }
  }

  const getTotalWaves = async () => {
    try {
      let defaultProvider = new ethers.getDefaultProvider('rinkeby');
      let wavePortalContract = new ethers.Contract(contractAddress, contractABI, defaultProvider);
      let totalCount = await wavePortalContract.getTotalWaves();
      return totalCount.toNumber();
    } catch (error) {
      return totalWaves;
    }
  }

  const wave = async () => {
    try {
      
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await getTotalWaves();
        setTotalWaves(count);
        console.log("Retrieved total wave count...", count);

        const waveTxn = await wavePortalContract.wave(textInput, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await getTotalWaves();
        setTotalWaves(count);
        console.log("Retrieved total wave count...", count);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      getAllWaves();
      setTextInput('');
    
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, []);

  useEffect(async () => {
    let count = await getTotalWaves();
    setTotalWaves(count);
  }, []);

  useEffect(() => {
    const onNewWave = (from, timestamp, message) => {
      console.log('New event! Wave:', from, timestamp, message);
      setAllWaves((previousState) => [
        ...previousState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        }
      ]);
    }

    let defaultProvider = new ethers.getDefaultProvider('rinkeby');
    let wavePortalContract = new ethers.Contract(contractAddress, contractABI, defaultProvider);
    wavePortalContract.on('NewWave', onNewWave);

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey, Degen!
        </div>

        <div className="bio">
        <p>I'm Mas. {totalWaves} fan(s) have waved at me so far.<br/>
          Connect your Ethereum wallet and wave at me too!</p>
        </div>

        <label className="bio">Message:</label>
        <input
          className="form"
          onChange={e => setTextInput(e.target.value)} disabled={!currentAccount}
          value={textInput}
        ></input><br/>
        <button className="waveButton" onClick={wave} disabled={textInput.length == 0}>
          Wave at Me
        </button>

      {!currentAccount && (
        <button className="saveButton" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}

      {allWaves.map((wave, index) => {
        return (
          <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
            <div>Address: {wave.address}</div>
            <div>Time: {wave.timestamp.toString()}</div>
            <div>Message: {wave.message}</div>
          </div>)
      })}
      </div>
    </div>
  );
}

export default App;