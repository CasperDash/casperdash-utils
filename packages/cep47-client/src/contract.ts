import {
    CLValue,
    CLPublicKey,
    CLMap,
    RuntimeArgs,
    Contracts,
    Keys,
    CLKeyParameters,
    CLValueBuilder,
    CLValueParsers,
    CLTypeTag
  } from "casper-js-sdk";
import { Contract } from "@casperdash/contract-client";
  
  const { toCLMap } = Contracts;
  
  /**
    * CEP47 installation parameters.
    *
    * @param name Name of the token.
    * @param contractName Name of the contract.
    * @param symbol Symbol of the token.
    * @param meta A Map built with Strings containing contract metadata.
    */
  export interface CEP47InstallArgs {
    name: string,
    contractName: string,
    symbol: string,
    meta: Map<string, string>
  };
  
  /**
    * CEP47 possible events.
    */
  export enum CEP47Events {
    MintOne = "cep47_mint_one",
    TransferToken = "cep47_transfer_token",
    BurnOne = "cep47_burn_one",
    MetadataUpdate = 'cep47_metadata_update',
    ApproveToken = 'cep47_approve_token'
  }
  
  /**
    * CEP47 event parser.
    * It can be used with the `EventStream` from the `casper-js-sdk`.
    *
    * @param params Object containing a contractPackageHash (prefixed with "hash-") and eventNames (a list of CEP47Events).
    * @param value A data object returned by the EventStream.
    *
    * @returns Object containing { error: boolean, success: boolean, data: Object }.
    * If success is set to true, the data object contains a list of parsed events.
    */
  export const CEP47EventParser = (
    {
      contractPackageHash,
      eventNames,
    }: { contractPackageHash: string; eventNames: CEP47Events[] },
    value: any
  ) => {
    if (value.body.DeployProcessed.execution_result.Success) {
      const { transforms } =
        value.body.DeployProcessed.execution_result.Success.effect;
  
          const cep47Events = transforms.reduce((acc: any, val: any) => {
            if (
              val.transform.hasOwnProperty("WriteCLValue") &&
              typeof val.transform.WriteCLValue.parsed === "object" &&
              val.transform.WriteCLValue.parsed !== null
            ) {
              const maybeCLValue = CLValueParsers.fromJSON(
                val.transform.WriteCLValue
              );
              const clValue = maybeCLValue.unwrap();
              if (clValue && clValue.clType().tag === CLTypeTag.Map) {
                const hash = (clValue as CLMap<CLValue, CLValue>).get(
                  CLValueBuilder.string("contract_package_hash")
                );
                const event = (clValue as CLMap<CLValue, CLValue>).get(CLValueBuilder.string("event_type"));
                if (
                  hash &&
                  // NOTE: Calling toLowerCase() because currently the JS-SDK doesn't support checksumed hashes and returns all lower-case values
                  // Remove it after updating the SDK
                  hash.value() === contractPackageHash.slice(5).toLowerCase() &&
                  event &&
                  eventNames.includes(event.value())
                ) {
                  acc = [...acc, { name: event.value(), clValue }];
                }
              }
            }
            return acc;
          }, []);
  
      return { error: null, success: !!cep47Events.length, data: cep47Events };
    }
  
    return null;
  };
  
  
  export class CEP47Contract extends Contract {
  
    constructor(public networkName: string, public contractHash?: string, public contractPackageHash?: string) {
      super(contractHash, contractPackageHash);
    }
  
    /**
     * Installs the CEP47 contract.
     *
     * @param wasm Uin8Array with contents of the WASM file.
     * @param args CEP47 installation args (see CEP47InstallArgs).
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns Deploy that can be signed and sent to the network. 
     */
    public install(
      wasm: Uint8Array,
      args: CEP47InstallArgs,
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        name: CLValueBuilder.string(args.name),
        contract_name: CLValueBuilder.string(args.contractName),
        symbol: CLValueBuilder.string(args.symbol),
        meta: toCLMap(args.meta),
      });
  
      return this.callSessionWasm(wasm, runtimeArgs, paymentAmount, deploySender, this.networkName, keys || []);
    }
  
    /**
     * Gives another account the right to spend tokens from this account.
     *
     * @param spender The account that can spend tokens from the owner account.
     * @param ids The token IDs that can be spent.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async approve(
      spender: CLKeyParameters,
      ids: string[],
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        spender: CLValueBuilder.key(spender),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id)))
      });
  
      return this.callEntrypoint(
        'approve',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
    /**
     * Creates new tokens for a specific recipient, given the token IDs and their metadata, paired in order.
     *
     * @param recipient The account for which tokens will be minted.
     * @param ids The token IDs that will be minted for this account.
     * @param metas The corresponding metadata for each minted token.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async mint(
      recipient: CLKeyParameters,
      ids: string[],
      metas: Map<string, string>[],
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(recipient),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id))),
        token_metas: CLValueBuilder.list(metas.map(meta => toCLMap(meta)))
      });
  
      return this.callEntrypoint(
        'mint',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
    /**
     * Creates several new tokens with specific IDs but with the same metadata.
     *
     * @param recipient The account for which tokens will be minted.
     * @param ids The token IDs that will be minted for this account.
     * @param meta The metadata that will be used for each minted token.
     * @param count Number of tokens to be minted.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async mintCopies(
      recipient: CLKeyParameters,
      ids: string[],
      meta: Map<string, string>,
      count: number,
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(recipient),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id))),
        token_meta: toCLMap(meta),
        count: CLValueBuilder.u32(count)
      });
  
      return this.callEntrypoint(
        'mint_copies',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
    /**
     * Destroys the given tokens for the account specified.
     *
     * @param owner The account for which tokens will be burned.
     * @param ids Token IDs that will be burned for this account.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async burn(
      owner: CLKeyParameters,
      ids: string[],
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        owner: CLValueBuilder.key(owner),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id))),
      });
  
      return this.callEntrypoint(
        'burn',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
    /**
     * Transfers tokens from a given account to another account.
     *
     * @param recipient The account that will receive tokens from the token owner.
     * @param owner The account that owns the tokens to be transferred.
     * @param ids Token IDs that will be transferred to the recipient.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async transferFrom(
      recipient: CLKeyParameters,
      owner: CLKeyParameters,
      ids: string[],
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(recipient),
        sender: CLValueBuilder.key(owner),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id))),
      });
  
      return this.callEntrypoint(
        'transfer_from',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
    /**
     * Transfers tokens from the caller's account to another account.
     *
     * @param recipient The account that will receive the tokens transferred from the caller.
     * @param ids Token IDs that will be transferred.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async transfer(
      recipient: CLKeyParameters,
      ids: string[],
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(recipient),
        token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id))),
      });
  
      return this.callEntrypoint(
        'transfer',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  
     /**
     * Updates the metadata of a token.
     *
     * @param id The ID of the token to be updated.
     * @param meta The new metadata for the token specified.
     * @param paymentAmount The payment amount that will be used for this Deploy.
     * @param deploySender The PublicKey of the Deploy sender.
     * @param keys Optional parameter containing a list of keys that can be used to sign the Deploy.
     *
     * @returns The Deploy that can be sent to the network.
     */
    public async updateTokenMeta(
      id: string,
      meta: Map<string, string>,
      paymentAmount: string,
      deploySender: CLPublicKey,
      keys?: Keys.AsymmetricKey[]
    ) {
      const runtimeArgs = RuntimeArgs.fromMap({
        token_id: CLValueBuilder.u256(id),
        token_meta: toCLMap(meta),
      });
  
      return this.callEntrypoint(
        'update_token_meta',
        runtimeArgs,
        deploySender,
        this.networkName,
        paymentAmount,
        keys
      );
    }
  }
  