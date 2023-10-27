import { CLKeyParameters, CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { BaseContract } from "./base";

export class Cep78Contract extends BaseContract {
    public async registerTokenOwner(
        {
            tokenOwner,
        }: {
            tokenOwner: CLKeyParameters;
        }
    ) {
        const runtimeArgs = RuntimeArgs.fromMap({
            token_owner: CLValueBuilder.key(
               tokenOwner
            ),
        });

        return this.buildEntryPointsArgs(
            'register_token_owner',
            runtimeArgs,
            String(5_000_000_000)
        );
    }

    public async approve(
        {
            operator,
            tokenId
        }
        : {
            operator: CLKeyParameters;
            tokenId: number;
        }) {
        const runtimeArgs = RuntimeArgs.fromMap({
            operator: CLValueBuilder.key(
                operator
            ),
            token_id: CLValueBuilder.u64(tokenId),
        });

        return this.buildEntryPointsArgs(
            'approve',
            runtimeArgs,
            String(5_000_000_000)
        );
    }
}