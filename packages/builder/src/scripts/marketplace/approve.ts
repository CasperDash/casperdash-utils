import { MarketplaceContract } from "../../contract/marketplace.contract";
import { CLValueBuilder, RuntimeArgs } from 'casper-js-sdk';
import { contractHashToByteArray } from 'contract-client';

const main = async () => {
    const marketplaceContract = new MarketplaceContract(
        'hash-89da76216016ec4c5e224968fd6df961bf33da016174966b2bbc3e642d89ad79'
        );

    const args = RuntimeArgs.fromMap({
        spender: CLValueBuilder.key(
            CLValueBuilder.byteArray(
                contractHashToByteArray('fa43a585efc7372e63833299ff64100928d23ec17ed62020282448a29f68afc0')
            ),
        ),
        token_ids: CLValueBuilder.list([CLValueBuilder.u256(104)]),
    })

    marketplaceContract.buildEntryPointsArgs(
        'approve',
        args,
    );

    const result = await marketplaceContract.sendLatestSpeculativeDeploy();

    console.log("...... Result: ", result);
}

main();