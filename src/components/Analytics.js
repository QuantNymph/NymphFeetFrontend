import { useEffect, useState } from "react";
import {utils} from 'ethers';

function Analytics({connection}) {
    const [log, setLog] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetcherCallback = () => {
            fetchData(connection);
        };
        async function load() {
            connection.contract.on("Mint", fetcherCallback);            
            fetchData(connection);
        }
        load();
        return () => {
            connection.contract.off("Mint", fetcherCallback);            
        };
    }, [connection]);

    async function fetchData(connection) {
        const [log, redemptions] = await Promise.all([
            connection.contract.queryFilter(await connection.contract.filters.Mint(), -50000),            
        ]);
        setLog(log.reverse());        
        setLoading(false);
    }

    return (<>
        <h1>NymphFeet Analytics!!</h1>
        {loading && <p>Loading...</p>}
        {!loading && <>
            <p><u>Recent mints:</u></p>

            <ul>
                {log.map(l => <li key={l.transactionHash}>
                    Feet #{l.args.tokenId.toNumber()} for <a href={`https://etherscan.io/tx/${l.transactionHash}`} target="_blank">{utils.formatEther(l.args.price)} ETH</a> by {l.args.owner.substring(0, 7)}
                </li>)}
            </ul>

            
        </>}
    </>);
}

export default Analytics;