import { BigNumber, type BigNumberish } from '@ethersproject/bignumber';
import {
  type CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  type Keys,
  RuntimeArgs
} from 'casper-js-sdk';

import {
  ApproveArgs,
  BurnArgs,
  ChangeSecurityArgs,
  InstallArgs,
  MintArgs,
  TransferArgs,
  TransferFromArgs
} from './types';
import { Contract } from '@casperdash/contract-client';

export default class CEP18Contract extends Contract {
  constructor(public networkName: string,
    contractHash?: `hash-${string}`,
    contractPackageHash?: `hash-${string}`) {
    super(contractHash, contractPackageHash);
  }

  /**
   * Intalls CEP-18
   * @param wasm contract representation of Uint8Array
   * @param args contract install arguments @see {@link InstallArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public install(
    wasm: Uint8Array,
    args: InstallArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const {
      name,
      symbol,
      decimals,
      totalSupply,
      eventsMode,
      enableMintAndBurn
    } = args;
    const runtimeArgs = RuntimeArgs.fromMap({
      name: CLValueBuilder.string(name),
      symbol: CLValueBuilder.string(symbol),
      decimals: CLValueBuilder.u8(decimals),
      total_supply: CLValueBuilder.u256(totalSupply)
    });

    if (eventsMode !== undefined) {
      runtimeArgs.insert('events_mode', CLValueBuilder.u8(eventsMode));
    }
    if (enableMintAndBurn !== undefined) {
      runtimeArgs.insert(
        'enable_mint_burn',
        CLValueBuilder.u8(enableMintAndBurn ? 1 : 0)
      );
    }

    return this.callSessionWasm(
      wasm,
      runtimeArgs,
      BigNumber.from(paymentAmount).toString(),
      sender,
      networkName ?? this.networkName,
      signingKeys
    );
  }

  /**
   * Transfers tokens to another user
   * @param args @see {@link TransferArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public transfer(
    args: TransferArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: CLValueBuilder.key(args.recipient),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'transfer',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Transfer tokens from the approved user to another user
   * @param args @see {@link TransferFromArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public transferFrom(
    args: TransferFromArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      owner: CLValueBuilder.key(args.owner),
      recipient: CLValueBuilder.key(args.recipient),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'transfer_from',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Approve tokens to other user
   * @param args @see {@link ApproveArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public approve(
    args: ApproveArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      spender: CLValueBuilder.key(args.spender),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'approve',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Increase allowance to the spender
   * @param args @see {@link ApproveArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public increaseAllowance(
    args: ApproveArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      spender: CLValueBuilder.key(args.spender),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'increase_allowance',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Decrease allowance from the spender
   * @param args @see {@link ApproveArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public decreaseAllowance(
    args: ApproveArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      spender: CLValueBuilder.key(args.spender),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'decrease_allowance',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Create `args.amount` tokens and assigns them to `args.owner`.
   * Increases the total supply
   * @param args @see {@link ApproveArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public mint(
    args: MintArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      owner: CLValueBuilder.key(args.owner),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'mint',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Destroy `args.amount` tokens from `args.owner`. Decreases the total supply
   * @param args @see {@link ApproveArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public burn(
    args: BurnArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({
      owner: CLValueBuilder.key(args.owner),
      amount: CLValueBuilder.u256(args.amount)
    });

    return this.callEntrypoint(
      'burn',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }

  /**
   * Change token security
   * @param args @see {@link ChangeSecurityArgs}
   * @param paymentAmount payment amount required for installing the contract
   * @param sender deploy sender
   * @param networkName network name which will be deployed to
   * @param signingKeys array of signing keys optional, returns signed deploy if keys are provided
   * @returns Deploy object which can be send to the node.
   */
  public changeSecurity(
    args: ChangeSecurityArgs,
    paymentAmount: BigNumberish,
    sender: CLPublicKey,
    networkName?: string,
    signingKeys?: Keys.AsymmetricKey[]
  ): DeployUtil.Deploy {
    const runtimeArgs = RuntimeArgs.fromMap({});

    // Add optional args
    if (args.adminList) {
      runtimeArgs.insert(
        'admin_list',
        CLValueBuilder.list(args.adminList.map(CLValueBuilder.key))
      );
    }
    if (args.minterList) {
      runtimeArgs.insert(
        'minter_list',
        CLValueBuilder.list(args.minterList.map(CLValueBuilder.key))
      );
    }
    if (args.burnerList) {
      runtimeArgs.insert(
        'burner_list',
        CLValueBuilder.list(args.burnerList.map(CLValueBuilder.key))
      );
    }
    if (args.mintAndBurnList) {
      runtimeArgs.insert(
        'mint_and_burn_list',
        CLValueBuilder.list(args.mintAndBurnList.map(CLValueBuilder.key))
      );
    }
    if (args.noneList) {
      runtimeArgs.insert(
        'none_list',
        CLValueBuilder.list(args.noneList.map(CLValueBuilder.key))
      );
    }

    // Check if at least one arg is provided and revert if none was provided
    if (runtimeArgs.args.size === 0) {
      throw new Error('Should provide at least one arg');
    }

    return this.callEntrypoint(
      'change_security',
      runtimeArgs,
      sender,
      networkName ?? this.networkName,
      BigNumber.from(paymentAmount).toString(),
      signingKeys
    );
  }
}