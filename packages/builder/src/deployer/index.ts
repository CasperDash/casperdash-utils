import { CasperClient, DeployUtil } from "casper-js-sdk";
import { CONFIGS } from "../configs";
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';

export const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getDeploy = async (nodeURL: string, deployHash: string) => {
    const client = new CasperClient(nodeURL);
    let i = 300;
    while (i !== 0) {
      const [deploy, raw] = await client.getDeploy(deployHash);
      if (raw.execution_results.length !== 0) {
        // @ts-ignore
        if (raw.execution_results[0].result.Success) {
          return deploy;
        } else {
          // @ts-ignore
          throw Error(
            "Contract execution: " +
              // @ts-ignore
              raw.execution_results[0].result.Failure.error_message
          );
        }
      } else {
        i--;
        await sleep(1000);
        continue;
      }
    }
    throw Error("Timeout after " + i + "s. Something's wrong");
  };

export const runDeployFlow = async (deploy: DeployUtil.Deploy, isWaitting = true) => {
    const deployHash = await deploy.send(CONFIGS.NODE_URL!);
  
    console.log("...... Deploy hash: ", deployHash);
    console.log("...... Waiting for the deploy...");
    if (isWaitting) {
        await getDeploy(CONFIGS.NODE_URL!, deployHash);
    }
  
  
    console.log(`...... Deploy ${deployHash} succedeed`);
};

export const speculativeDeploy = async (deployJson:any) => {
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