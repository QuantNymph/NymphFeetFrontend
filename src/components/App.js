import React, { useEffect, useState } from 'react';
import {ethers, utils} from 'ethers';
import abi from '../abi/NymphFeet.json';
import Owned from './Owned';
// import Rewards from './Rewards';
import Analytics from './Analytics';
// import Cases from './Cases';

const CONTRACT_ADDRESS = '0x8BF9d84E5f2D427B84D7d8bfd4E1B656570c0CaF';
const CORRECT_CHAIN_ID = 1; // 1337 (local) or 42161 (arbi) or 421611 (arbi test)
const CORRECT_CHAIN_HEX = '0x1'; // 0x539 (local) or 0xA4B1 (arbi) or 0x66EEB (arbi-test)

const MINT_TAB = 'MINT_TAB';
const OWNED_TAB = 'OWNED_TAB';
// const REWARDS_TAB = 'REWARDS_TAB';
const ANALYTICS_TAB = 'ANALYTICS_TAB';
// const CASES_TAB = 'CASES_TAB';

const LAUNCHED = true;

function App() {
  const [isConnected, setConnected] = useState(false);
  const [ethConnected, setEthConnected] = useState(false);

  const [connection, setConnection] = useState(null);
  const [state, setState] = useState({
    mintPrice: '...',
    totalSupply: '...',
    supplyLimit: '...',    
    nextPoolUnlockLimit: '...',
    mintable: true,
  });

  const [currentTab, setCurrentTab] = useState(MINT_TAB);

  useEffect(() => {
    async function load() {
      if (!LAUNCHED) {
        return;
      }

      if (typeof web3 === 'undefined') {
        return; // not connected, default to unconnected state
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      setConnected(true);

      // nasty hack, thanks neso
      provider.provider.on("accountsChanged", async () => {
        window.location.reload();
      });
      provider.provider.on("chainChanged", async () => {
        window.location.reload();
      });

      const network = await provider.getNetwork();
      if (network.chainId !== CORRECT_CHAIN_ID) {
        setConnection({provider});
        return;
      }
      setEthConnected(true);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider).connect(provider.getSigner());      
      setConnection({contract, provider});

      contract.on("Mint", () => {
        fetchData({contract, provider});
      });
      provider.on("block", () => {
        fetchData({contract, provider});
      });

      fetchData({contract, provider});
    }
    load();
  }, []);

  async function fetchData({contract, provider}) {
    const [mintPrice, totalSupply, supplyLimit, contractBalance, totalPools] = await Promise.all([
      contract.mintPrice(), contract.totalSupply(), contract.MAX_FEET(), provider.getBalance(contract.address), contract.TOTAL_REWARD_POOLS()
    ]);

    const rewardPoolSlot = totalSupply.div(supplyLimit.div(totalPools));

    setState({
      ...state,
      mintPrice: utils.formatEther(mintPrice),
      totalSupply: totalSupply.toNumber(),
      supplyLimit: supplyLimit.toNumber(),      
      nextPoolUnlockLimit: rewardPoolSlot.add(1).mul(supplyLimit.div(totalPools)).toNumber(),
      mintable: totalSupply.toNumber() !== supplyLimit.toNumber()
    });
  }

  async function mint() {
    const signer = connection.contract.connect(connection.provider.getSigner(0));
    const price = await connection.contract.mintPrice();
    await signer.mint({value: price});
  }

  // thanks again neso for the scuffed code
  async function switchNetworks() {
    try {
      await connection.provider.send('wallet_switchEthereumChain', [{chainId: CORRECT_CHAIN_HEX}]);
    } catch (switchError) {
      console.error(switchError);
    }
  }

  return (
    <div id="wrapper">
      <div className="content">
        {currentTab === MINT_TAB && <>
          <h1>NymphFeet!!</h1>
          <p className="tagline">100 Nymph Feet pics, for the simps</p>

          <p>
            All Nymph, all the time <br />
            Hosted on ipfs.
          </p>

          <p>
            Will be used in experiments with token-gated fan club structure <br />
            Members of the fan club will receive airdrops and free mints from future personal projects <br />
            Now's your chance to get some long Nymph exposure!
          </p>

          <p>
            6 hour dutch auction from 20 ETH to .01 ETH! <br />
            Resets after each pool unlocks!
          </p>          

          <hr />

          {!LAUNCHED && <p><u>Launching soon!</u></p>}

          {LAUNCHED && !isConnected && <button disabled>Connecting...</button>}

          {isConnected && !ethConnected && <>
            <p>
              Non-eth network detected.<br />
              <u>This project requires you to connect to Eth mainnet!</u>
            </p>
            <button onClick={switchNetworks}>Connect!!</button>            
          </>}

          {isConnected && ethConnected && <>
            {state.mintable && <>
              <button onClick={mint}>Mint!!!</button>
              <p>
                Current price: <u>{state.mintPrice} ETH</u> <br />
                Mint progress to next pool unlock: <u>{state.totalSupply}/{state.nextPoolUnlockLimit}</u>
              </p>
              <p>                
                Current feet: <u>{state.totalSupply}/{state.supplyLimit}</u>
              </p>
            </>}
            {!state.mintable && <button disabled={true} onClick={mint}>All feet minted!!</button>}
          </>}          
        </>}

        {currentTab === OWNED_TAB && <Owned connection={connection} />}        
        {currentTab === ANALYTICS_TAB && <Analytics connection={connection} />}        

        {isConnected && ethConnected && <>
          <hr />
          <p>
            [ <a onClick={() => setCurrentTab(MINT_TAB)}>mint</a> | <a onClick={() => setCurrentTab(OWNED_TAB)}>owned</a> | <a onClick={() => setCurrentTab(ANALYTICS_TAB)}>analytics</a> ]
          </p>
        </>}
      </div>
    </div>
  );
}

export default App;
