
import { MarketplaceContract } from "../../contract/marketplace.contract";
import { CLValueBuilder, RuntimeArgs } from 'casper-js-sdk';
import { contractHashToByteArray } from 'contract-client';
import wasm from '../../wasm/list_item.wasm';

const main = async () => {
    const marketplaceContract = new MarketplaceContract(
        'hash-291038747f38bbdb4f21c4e6374578ceb45a4c187cca36113d4b64028ed1e508'
    );

    const args = RuntimeArgs.fromMap({
        nft_contract_hash: CLValueBuilder.key(
            CLValueBuilder.byteArray(
                contractHashToByteArray('89da76216016ec4c5e224968fd6df961bf33da016174966b2bbc3e642d89ad79')
            ),
        ),
        market_contract_hash: CLValueBuilder.key(
            CLValueBuilder.byteArray(
                contractHashToByteArray('291038747f38bbdb4f21c4e6374578ceb45a4c187cca36113d4b64028ed1e508')
            ),
        ),
        spender: CLValueBuilder.key(
            CLValueBuilder.byteArray(
                contractHashToByteArray('fa43a585efc7372e63833299ff64100928d23ec17ed62020282448a29f68afc0')
            ),
        ),
        token_id: CLValueBuilder.string('141'),
        amount: CLValueBuilder.u512(12_000_000_000),
    })


    marketplaceContract.buildSessionWasmArgs(
        wasm,
        args,
        `${15_000_000_000}`,
    );

    const result = await marketplaceContract.sendLatestSpeculativeDeploy();

    console.log("...... Result: ", result);
}

main();