import { DeployUtil, Keys } from "casper-js-sdk";
import { CONFIGS, OWNER_KEYS } from "../configs";
import { Contract } from 'contract-client';
import { getDeploy, runDeployFlow } from "../deployer";
import Client, { HTTPTransport, RequestManager } from "@open-rpc/client-js";

export const convertHashStrToHashBuff = (hashStr: string) => {
    let hashHex = hashStr;
    if (hashStr.startsWith("hash-")) {
      hashHex = hashStr.slice(5);
    }
    return Buffer.from(hashHex, "hex");
};

export class BaseContract extends Contract {
    public currentBuilded: DeployUtil.Deploy;
    public caller: Keys.AsymmetricKey = OWNER_KEYS;
    public network: string = CONFIGS.NETWORK;

    constructor(
        contractHash?: string,
        contractPackageHash?: string,
        network?: string
    ) {
        super(
            contractHash,
            contractPackageHash
        );

        if (network) {
            this.network = network;
        }
    }

    public setCaller(keys: Keys.AsymmetricKey) {
        this.caller = keys;
    }

    public getCaller() {
        return this.caller;
    }

    public async buildSessionWasmArgs(wasm: Uint8Array, args: any, networkFee = `${15_000_000_000}`) {
        const result = this.callSessionWasm(
            wasm,
            args,
            networkFee,
            this.caller.publicKey,
            this.network,
            [this.caller]
        );

        this.currentBuilded = result;

        return this.sendSafeDeploy(result);
    }

    public async buildEntryPointsArgs(entryPoint: string, args: any, networkFee = `${15_000_000_000}`) {
        const result = this.callEntrypoint(
            entryPoint,
            args,
            this.caller.publicKey,
            this.network,
            networkFee,
            [this.caller]
        );

        this.currentBuilded = result;

        return this.sendSafeDeploy(result);
    }

    public async speculativeDeploy(deployJson:any) {
        // TODO: User casperClient.speculativeDeploy later after 
        const transport = new HTTPTransport(CONFIGS.SPECULATIVE_NODE_URL);
        const requestManager = new RequestManager([transport]);
    
        const client = new Client(requestManager);
    
        const result = await client.request({
            method: 'speculative_exec',
            params: { ...deployJson },
          });
    
        return result;
    }

    public async deploy(deploy: DeployUtil.Deploy, isWaitting = true) {
        const deployHash = await deploy.send(CONFIGS.NODE_URL!);
      
        console.log("...... Deploy hash: ", deployHash);
        console.log("...... Waiting for the deploy...");
        if (isWaitting) {
            await getDeploy(CONFIGS.NODE_URL!, deployHash);
        }
      
        console.log(`...... Deploy ${deployHash} succedeed`);
    };

    public async sendDeploy() {
        return runDeployFlow(this.currentBuilded);
    }

    public async sendLatestSpeculativeDeploy() {
        return this.sendSpeculativeDeploy(this.currentBuilded);
    }

    public async sendSpeculativeDeploy(deploy: DeployUtil.Deploy) {
        const deployJson = DeployUtil.deployToJson(deploy);

        return this.speculativeDeploy(deployJson);
    }

    public async speculativelyDeployThrow(deploy: DeployUtil.Deploy) {
        const result = await this.sendSpeculativeDeploy(deploy);

        const { execution_result } = result;

        if (execution_result.Success) {
            return execution_result.Success;
        }

        console.log("...... Error: ", execution_result.Failure);

        throw new Error(execution_result.Failure.error_message);
    }

    public async sendSafeDeploy(deploy: DeployUtil.Deploy) {
        await this.speculativelyDeployThrow(deploy);

        return this.sendDeploy();
    }
}