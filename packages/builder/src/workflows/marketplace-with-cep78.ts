import { CLValueBuilder } from "casper-js-sdk";
import { BUYER_KEYS } from "../configs/default";
import { Cep78Contract } from "../contract/cep78.contract";
import { MarketplaceContract } from "../contract/marketplace.contract";
import { contractHashToByteArray } from "contract-client";

const MARKETPLACE_CONTRACT_PACKAGE_HASH = 'e7cf0e4796821217ae86e2b34848cc6e1ef610b87572bd0d0848762448f1b3f2';
const MARKETPLACE_CONTRACT_HASH = '03a714464b106f79db74110c0d7f66766e74354193189d77bc5d18cf8e89a000';
const TOKEN_HASH = 'a1cce80d2f418d4e8c64b1d89c7b06c822f903b1d3a50548fa4f048c183671ee';
const TOKEN_ID = '56';

const run = async () => {
    const marketplaceContract = new MarketplaceContract(
        `hash-${MARKETPLACE_CONTRACT_HASH}`
    );
    const cep78Contract = new Cep78Contract(
        `hash-${TOKEN_HASH}`
    );

    // Approve CEP78 contract package hash
    await cep78Contract.approve(
        {
            operator: CLValueBuilder.byteArray(
                contractHashToByteArray(MARKETPLACE_CONTRACT_PACKAGE_HASH)
            ),
            tokenId: Number(TOKEN_ID),
        }
    );

    // List item
    await marketplaceContract.listItem(
        {
            tokenContractHash: TOKEN_HASH,
            tokenId: TOKEN_ID,
            amount: 12_000_000_000,
        }
    );
    
    // Approve CEP78 contract hash
    await cep78Contract.approve(
        {
            operator: CLValueBuilder.byteArray(
                contractHashToByteArray(MARKETPLACE_CONTRACT_HASH)
            ),
            tokenId: Number(TOKEN_ID),
        }
    );

    // Change caller
    marketplaceContract.setCaller(BUYER_KEYS);

    // Buy item
    await marketplaceContract.buyItem(
        {
            tokenContractHash: TOKEN_HASH,
            tokenId: TOKEN_ID,
            amount: 12_000_000_000,
        }
    );
}

run();