import { CLValueBuilder, RuntimeArgs } from 'casper-js-sdk';
import { BaseContract } from './base';
import { contractHashToByteArray } from 'contract-client';
import { hexToBytes } from '@noble/hashes/utils';

import BuyItemWasm from '../wasm/buy_item.wasm';

export type InstallArgs = {
    collectionName: string;
    collectionSymbol: string;
    totalTokenSupply: string;
};

class ContractUtils {
    public static contractToCLByteArray(hash: string) {
      return CLValueBuilder.byteArray(this.contractToByteArray(hash));
    }
  
    public static contractToByteArray(hash: string) {
      const hashOnly = hash.replace('hash-', '').replace('contract-', '');
      return hexToBytes(hashOnly);
    }
  }

export class MarketplaceContract extends BaseContract {
    public async install(
        wasm: Uint8Array,
        args: InstallArgs,
        networkFee = `${15_000_000_000}`

    ) {
        const runtimeArgs = RuntimeArgs.fromMap({
            collection_name: CLValueBuilder.string(args.collectionName),
            collection_symbol: CLValueBuilder.string(args.collectionSymbol),
            total_token_supply: CLValueBuilder.string(args.totalTokenSupply),
        });

        return this.buildSessionWasmArgs(
            wasm,
            runtimeArgs,
            networkFee
        );
    }

    public async listItem (
        {
            tokenContractHash,
            tokenId,
            amount,
        }: {
            tokenContractHash: string;
            tokenId: string;
            amount: number;
        }
    ) {
        const args = RuntimeArgs.fromMap({
            token: CLValueBuilder.byteArray(
                contractHashToByteArray(tokenContractHash)
            ),
            token_id: CLValueBuilder.string(tokenId),
            amount: CLValueBuilder.u512(amount),
        })
    
        return this.buildEntryPointsArgs(
            'list_item',
            args,
        );
    }

    public async buyItem(
        {
            tokenContractHash,
            tokenId,
            amount,
        }: {
            tokenContractHash: string;
            tokenId: string;
            amount: number;
        }
    ) {
        const runtimeArgs = RuntimeArgs.fromMap({
            market: ContractUtils.contractToCLByteArray(this.contractHash!),
            token: ContractUtils.contractToCLByteArray(tokenContractHash),
            token_id: CLValueBuilder.string(tokenId),
            amount: CLValueBuilder.u512(amount),
          });
      

        return this.buildSessionWasmArgs(
            BuyItemWasm,
            runtimeArgs,
            String(33010427510)
        )
    }
}