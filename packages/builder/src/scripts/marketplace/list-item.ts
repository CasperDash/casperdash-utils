
import { MarketplaceContract } from "../../contract/marketplace.contract";

const main = async () => {
    const marketplaceContract = new MarketplaceContract(
        'hash-03a714464b106f79db74110c0d7f66766e74354193189d77bc5d18cf8e89a000'
    );

    marketplaceContract.listItem(
        {
            tokenContractHash: 'a1cce80d2f418d4e8c64b1d89c7b06c822f903b1d3a50548fa4f048c183671ee',
            tokenId: '59',
            amount: 12_000_000_000,
        }
    );

    const result = await marketplaceContract.sendLatestSpeculativeDeploy();

    console.log("...... Result: ", result);
}

main();