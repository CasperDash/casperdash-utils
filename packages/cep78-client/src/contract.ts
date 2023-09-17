import {
  CLPublicKey,
  CLKey,
  RuntimeArgs,
  Keys,
  CLValueBuilder,
} from "casper-js-sdk";

import {
  CallConfig,
  InstallArgs,
  NamedKeyConventionMode,
  ConfigurableVariables,
  MintArgs,
  RegisterArgs,
  BurnArgs,
  ApproveArgs,
  ApproveAllArgs,
  TransferArgs,
  MigrateArgs,
  NFTIdentifierMode,
  MetadataMutability,
  TokenMetadataArgs,
  StoreBalanceOfArgs,
  StoreApprovedArgs,
  StoreOwnerOfArgs,
} from "./types";

import { Contract } from '@casperdash/contract-client';

export * from "./types";

enum ERRORS {
  CONFLICT_CONFIG = "Conflicting arguments provided",
}

const convertHashStrToHashBuff = (hashStr: string) => {
  let hashHex = hashStr;
  if (hashStr.startsWith("hash-")) {
    hashHex = hashStr.slice(5);
  }
  return Buffer.from(hashHex, "hex");
};

const buildHashList = (list: string[]) =>
  list.map((hashStr) =>
    CLValueBuilder.byteArray(convertHashStrToHashBuff(hashStr))
  );

export class CEP78Contract extends Contract {
  public contractHashKey: CLKey;

  constructor(
    public networkName: string,
    contractHash?: string,
    contractPackageHash?: string
    ) {
    super(contractHash, contractPackageHash);
  }

  public install(
    args: InstallArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    wasm: Uint8Array,
    keys?: Keys.AsymmetricKey[],
  ) {
    if (!wasm) {
        throw new Error("You need to provide wasm");
    }

    const wasmToInstall = wasm;

    if (
      args.identifierMode === NFTIdentifierMode.Hash &&
      args.metadataMutability === MetadataMutability.Mutable
    ) {
      throw new Error(
        `You can't combine NFTIdentifierMode.Hash and MetadataMutability.Mutable`
      );
    }

    const runtimeArgs = RuntimeArgs.fromMap({
      collection_name: CLValueBuilder.string(args.collectionName),
      collection_symbol: CLValueBuilder.string(args.collectionSymbol),
      total_token_supply: CLValueBuilder.u64(args.totalTokenSupply),
      ownership_mode: CLValueBuilder.u8(args.ownershipMode),
      nft_kind: CLValueBuilder.u8(args.nftKind),
      nft_metadata_kind: CLValueBuilder.u8(args.nftMetadataKind),
      identifier_mode: CLValueBuilder.u8(args.identifierMode),
      metadata_mutability: CLValueBuilder.u8(args.metadataMutability),
    });

    // TODO: Validate here
    if (args.jsonSchema !== undefined) {
      runtimeArgs.insert(
        "json_schema",
        CLValueBuilder.string(JSON.stringify(args.jsonSchema))
      );
    }

    if (args.mintingMode !== undefined) {
      runtimeArgs.insert("minting_mode", CLValueBuilder.u8(args.mintingMode));
    }

    if (args.allowMinting !== undefined) {
      runtimeArgs.insert(
        "allow_minting",
        CLValueBuilder.bool(args.allowMinting)
      );
    }

    if (args.whitelistMode !== undefined) {
      runtimeArgs.insert(
        "whitelist_mode",
        CLValueBuilder.u8(args.whitelistMode)
      );
    }

    if (args.holderMode !== undefined) {
      runtimeArgs.insert("holder_mode", CLValueBuilder.u8(args.holderMode));
    }

    if (args.contractWhitelist !== undefined) {
      const list = buildHashList(args.contractWhitelist);
      runtimeArgs.insert("contract_whitelist", CLValueBuilder.list(list));
    }

    if (args.burnMode !== undefined) {
      runtimeArgs.insert("burn_mode", CLValueBuilder.u8(args.burnMode));
    }

    if (args.ownerReverseLookupMode !== undefined) {
      runtimeArgs.insert(
        "owner_reverse_lookup_mode",
        CLValueBuilder.u8(args.ownerReverseLookupMode)
      );
    }

    if (args.namedKeyConventionMode !== undefined) {
      runtimeArgs.insert(
        "named_key_convention",
        CLValueBuilder.u8(args.namedKeyConventionMode)
      );
    }

    if (args.namedKeyConventionMode === NamedKeyConventionMode.V1_0Custom) {
      if (!args.accessKeyName || !args.hashKeyName) {
        throw new Error(
          "You need to provide 'accessKeyName' and 'hashKeyName' if you want to use NamedKeyConventionMode.V1_0Custom"
        );
      }
      runtimeArgs.insert(
        "access_key_name",
        CLValueBuilder.string(args.accessKeyName)
      );
      runtimeArgs.insert(
        "hash_key_name",
        CLValueBuilder.string(args.hashKeyName)
      );
    }

    if (args.eventsMode !== undefined) {
      runtimeArgs.insert("events_mode", CLValueBuilder.u8(args.eventsMode));
    }

    return this.callSessionWasm(
      wasmToInstall,
      runtimeArgs,
      paymentAmount,
      deploySender,
      this.networkName,
      keys || []
    );
  }

  public setVariables(
    args: ConfigurableVariables,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({});

    if (args.allowMinting !== undefined) {
      runtimeArgs.insert(
        "allow_minting",
        CLValueBuilder.bool(args.allowMinting)
      );
    }

    if (args.contractWhitelist !== undefined) {
      const list = buildHashList(args.contractWhitelist);
      runtimeArgs.insert("contract_whitelist", CLValueBuilder.list(list));
    }

    const preparedDeploy = this.callEntrypoint(
      "set_variables",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public register(
    args: RegisterArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_owner: CLValueBuilder.key(args.tokenOwner),
    });

    const preparedDeploy = this.callEntrypoint(
      "register_owner",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public revoke(
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const preparedDeploy = this.callEntrypoint(
      "revoke",
      RuntimeArgs.fromMap({}),
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public mint(
    args: MintArgs,
    config: CallConfig,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[],
    wasm?: Uint8Array
  ) {
    if (config.useSessionCode === false && !!wasm)
      throw new Error(ERRORS.CONFLICT_CONFIG);

    const runtimeArgs = RuntimeArgs.fromMap({
      token_owner: CLValueBuilder.key(args.owner),
      token_meta_data: CLValueBuilder.string(JSON.stringify(args.meta)),
    });

    if (config.useSessionCode) {
      if (!wasm) {
        throw new Error("Missing wasm argument");
      }   
      if (!args.collectionName) {
        throw new Error("Missing collectionName argument");
      }

      const wasmToCall = wasm;

      runtimeArgs.insert("nft_contract_hash", this.contractHashKey);
      runtimeArgs.insert(
        "collection_name",
        CLValueBuilder.string(args.collectionName)
      );

      const preparedDeploy = this.callSessionWasm(
        wasmToCall,
        runtimeArgs,
        paymentAmount,
        deploySender,
        this.networkName,
        keys
      );

      return preparedDeploy;
    }

    const preparedDeploy = this.callEntrypoint(
      "mint",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public burn(
    args: BurnArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({});

    if (args.tokenId !== undefined) {
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenId));
    }

    if (args.tokenHash !== undefined) {
      runtimeArgs.insert("token_hash", CLValueBuilder.string(args.tokenHash));
    }

    const preparedDeploy = this.callEntrypoint(
      "burn",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public transfer(
    args: TransferArgs,
    config: CallConfig,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[],
    wasm?: Uint8Array
  ) {
    if (config.useSessionCode === false && !!wasm)
      throw new Error(ERRORS.CONFLICT_CONFIG);

    const runtimeArgs = RuntimeArgs.fromMap({
      target_key: CLValueBuilder.key(args.target),
      source_key: CLValueBuilder.key(args.source),
    });

    if (args.tokenId) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(false));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenId));
    }

    if (args.tokenHash) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(true));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenHash));
    }

    if (config.useSessionCode) {
      if (!wasm) {
        throw new Error("Missing wasm argument");
      }
      runtimeArgs.insert("nft_contract_hash", this.contractHashKey);
      const wasmToCall = wasm;

      const preparedDeploy = this.callSessionWasm(
        wasmToCall,
        runtimeArgs,
        paymentAmount,
        deploySender,
        this.networkName,
        keys
      );

      return preparedDeploy;
    }

    const preparedDeploy = this.callEntrypoint(
      "transfer",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public setTokenMetadata(
    args: TokenMetadataArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_meta_data: CLValueBuilder.string(
        JSON.stringify(args.tokenMetaData)
      ),
    });

    const preparedDeploy = this.callEntrypoint(
      "set_token_metadata",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public approve(
    args: ApproveArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      operator: CLValueBuilder.key(args.operator),
    });

    if (args.tokenId !== undefined) {
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenId));
    }

    if (args.tokenHash !== undefined) {
      runtimeArgs.insert("token_hash", CLValueBuilder.string(args.tokenHash));
    }

    const preparedDeploy = this.callEntrypoint(
      "approve",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public approveAll(
    args: ApproveAllArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_owner: CLValueBuilder.key(args.tokenOwner),
      approve_all: CLValueBuilder.bool(args.approveAll),
      operator: CLValueBuilder.key(args.operator),
    });

    const preparedDeploy = this.callEntrypoint(
      "set_approval_for_all",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }

  public storeBalanceOf(
    args: StoreBalanceOfArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    wasm: Uint8Array,
    keys?: Keys.AsymmetricKey[],
  ) {
    if (!wasm) {
        throw new Error("You need to provide wasm");
    }

    const wasmToCall = wasm;

    const runtimeArgs = RuntimeArgs.fromMap({
      nft_contract_hash: this.contractHashKey,
      token_owner: args.tokenOwner,
      key_name: CLValueBuilder.string(args.keyName),
    });

    const preparedDeploy = this.callSessionWasm(
      wasmToCall,
      runtimeArgs,
      paymentAmount,
      deploySender,
      this.networkName,
      keys
    );

    return preparedDeploy;
  }

  public storeGetApproved(
    args: StoreApprovedArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    wasm: Uint8Array,
    keys?: Keys.AsymmetricKey[],
  ) {
    if (!wasm) {
        throw new Error("You need to provide wasm");
    }
    const wasmToCall = wasm;

    const runtimeArgs = RuntimeArgs.fromMap({
      nft_contract_hash: this.contractHashKey,
      key_name: CLValueBuilder.string(args.keyName),
    });

    if (args.tokenId) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(false));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenId));
    }

    if (args.tokenHash) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(true));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenHash));
    }

    const preparedDeploy = this.callSessionWasm(
      wasmToCall,
      runtimeArgs,
      paymentAmount,
      deploySender,
      this.networkName,
      keys
    );

    return preparedDeploy;
  }

  public storeOwnerOf(
    args: StoreOwnerOfArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    wasm: Uint8Array,
    keys?: Keys.AsymmetricKey[],
  ) {
    if (!wasm) {
        throw new Error("You need to provide wasm");
    }

    const wasmToCall = wasm;

    const runtimeArgs = RuntimeArgs.fromMap({
      nft_contract_hash: this.contractHashKey,
      key_name: CLValueBuilder.string(args.keyName),
    });

    if (args.tokenId) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(false));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenId));
    }

    if (args.tokenHash) {
      runtimeArgs.insert("is_hash_identifier_mode", CLValueBuilder.bool(true));
      runtimeArgs.insert("token_id", CLValueBuilder.u64(args.tokenHash));
    }

    const preparedDeploy = this.callSessionWasm(
      wasmToCall,
      runtimeArgs,
      paymentAmount,
      deploySender,
      this.networkName,
      keys
    );

    return preparedDeploy;
  }


  public migrate(
    args: MigrateArgs,
    paymentAmount: string,
    deploySender: CLPublicKey,
    keys?: Keys.AsymmetricKey[]
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      collection_name: CLValueBuilder.string(args.collectionName),
    });

    const preparedDeploy = this.callEntrypoint(
      "migrate",
      runtimeArgs,
      deploySender,
      this.networkName,
      paymentAmount,
      keys
    );

    return preparedDeploy;
  }
}
