import React, { useEffect, useState } from 'react';

class Arbibot {
  constructor(tokenId, owner, contract) {
    this.tokenId = tokenId;
    this.owner = owner;
    this.contract = contract;
  }

  async fetch() {
    const storedURL = window.localStorage.getItem(`bot-${this.tokenId}`);
    if (storedURL !== null) {
      this.image = storedURL;
      return;
    }
    const tokenURI = await this.contract.tokenURI(this.tokenId);
    const jsonBlob = await (await fetch(tokenURI)).json();
    window.localStorage.setItem(`bot-${this.tokenId}`, jsonBlob.image);
    this.image = jsonBlob.image;
  }
}

function Owned({connection}) {
  const [isLoading, setLoading] = useState(true);
  const [ownedBots, setOwnedBots] = useState([]);

  useEffect(() => {
    const fetcherCallback = () => {
      fetchData(connection);
    };
    async function load() {
      connection.contract.on("Transfer", fetcherCallback);
      fetchData(connection);
    }
    load();
    return () => {
      connection.contract.off("Transfer", fetcherCallback);
    };
  }, [connection]);

  async function fetchData({contract, provider}) {
    const address = await provider.getSigner(0).getAddress();
    const owned = (await contract.balanceOf(address)).toNumber();
    
    let toFetch = [];
    for (let i = 0; i < owned; i++) {
      toFetch.push(contract.tokenOfOwnerByIndex(address, i));
    }
    const ownedIds = await Promise.all(toFetch);
    const arbiBots = ownedIds.map(id => new Arbibot(id.toNumber(), address, contract));
    await Promise.all(arbiBots.map(b => b.fetch()));
    setOwnedBots(arbiBots);

    setLoading(false);
  }

  return (
    <>
      <h1>Your gallery!!</h1>

      <br />

      {isLoading && <p>Loading owned feet pics... <br /> (rendering might take a while depending on your RPC)</p>}
      {!isLoading && ownedBots.length === 0 && <p>You don't own any feet pics yet!</p>}
      {!isLoading && ownedBots.length > 0 && <div id="invite"><a href='https://discord.gg/AG5zAhBUCT'>Come to the discord!</a> (verify with collab.land for access)</div>}
      {!isLoading && ownedBots.length > 0 && <div id="gallery">        
        {ownedBots.map(b => (
          <div className="arbibot" key={b.tokenId}>            
            <img width={256} height={'auto'} src={"https://ipfs.io".concat(b.image)} key={"https://ipfs.io".concat(b.image)}></img>
            <p>Feet Pic #{b.tokenId}</p>
          </div>
        ))}
      </div>}
    </>
  );
}

export default Owned;