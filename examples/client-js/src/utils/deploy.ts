import { CasperClient, DeployUtil} from 'casper-js-sdk';

export const NODE_URL = 'http://76.91.193.251:7777/rpc';
export const NETWORK_NAME = 'casper-test';

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
    console.log('deploy: ', deploy);

  const deployHash = await deploy.send(NODE_URL!);

  console.log("...... Deploy hash: ", deployHash);
  console.log("...... Waiting for the deploy...");
  if (isWaitting) {
      await getDeploy(NODE_URL!, deployHash);
  }


  console.log(`...... Deploy ${deployHash} succedeed`);
};
