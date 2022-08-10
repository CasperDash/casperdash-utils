import {
  CasperServiceByJsonRPC,
  DeployUtil,
  CLPublicKey,
  CLKey,
  CLAccountHash,
  CLValueParsers,
  CasperClient,
  JsonDeploy,
} from 'casper-js-sdk';

export default class CasperServices {
  url: string;
  casperServiceRPC: CasperServiceByJsonRPC;
  casperClient: CasperClient;

  constructor(RPC_URL: string) {
    this.url = RPC_URL;
    this.casperServiceRPC = new CasperServiceByJsonRPC(RPC_URL);
    this.casperClient = new CasperClient(RPC_URL);
  }

  /**
   * Returns root hash of global state at a recent block.
   * @return {String} state root hash.
   */
  getStateRootHash = async () => {
    const latestBlockInfo = await this.casperServiceRPC.getLatestBlockInfo();
    return latestBlockInfo?.block?.header.state_root_hash;
  };

  /**
   * Returns latest block hash.
   * @return {String} latest block hash.
   */
  getLatestBlockHash = async () => {
    const latestBlockInfo = await this.casperServiceRPC.getLatestBlockInfo();
    return latestBlockInfo.block?.hash;
  };

  /**
   * Returns current era id.
   * @return {String} era id.
   */
  getCurrentEraId = async () => {
    const { block } = await this.casperServiceRPC.getLatestBlockInfo();
    return block?.header?.era_id;
  };

  /**
   * Send deploy to network.
   * @param {Object} deployJson - Deploy Json Object.
   * @return {String} deploy hash.
   */
  putDeploy = async (deployJson: JsonDeploy) => {
    try {
      const deploy = DeployUtil.deployFromJson(deployJson);
      if (deploy.ok) {
        const hash = await this.casperClient.putDeploy(deploy.val);
        return hash;
      } else {
        return deploy.err;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * Get deploy result.
   * @param {String} deployHash - Deploy hash.
   * @return {Object} deploy result.
   */
  getDeployResultJson = async (deployHash: string) => {
    const deploy = await this.casperClient.getDeploy(deployHash);
    return deploy.length && deploy[1];
  };

  /**
   * Get deploy object by deploy hash.
   * @param {String} deployHash - Deploy hash.
   * @return {Object} Deploy object.
   */
  getDeployJson = async (deployHash: string) => {
    const deploy = await this.casperClient.getDeploy(deployHash);
    const jsonDeploy = DeployUtil.deployToJson(deploy[0]);

    return jsonDeploy;
  };

  /**
   * Get deploy object by deploy hash.
   * @param {String} deployHash - Deploy hash.
   * @return {Object} Deploy object.
   */
  getDeploysResult = async (deployHash: string) => {
    const hashes = Array.isArray(deployHash) ? deployHash : [deployHash];
    const deploys = await Promise.all(
      hashes.map(async (hash) => {
        try {
          const deployJson = await this.getDeployResultJson(hash);
          return deployJson;
        } catch (error) {
          return { deploy: { hash }, execution_results: [] };
        }
      }),
    );

    return deploys;
  };

  /**
   * Get deploy result status.
   * @param {Array} deployHash - List of deploy hash.
   * @return {Array} List of deploy hash with status.
   */
  getDeploysStatus = async (deployHash: string) => {
    const deploysResults = await this.getDeploysResult(deployHash);
    return deploysResults.length
      ? deploysResults.map((result) => {
          const { execution_results, deploy } = result;
          return {
            hash: deploy.hash,
            status:
              !execution_results || !execution_results.length
                ? 'pending'
                : execution_results.some((rs) => rs.result.Failure)
                ? 'failed'
                : 'completed',
          };
        })
      : [];
  };

  /**
   * Get on-chain state value by key.
   * @param {String} deployHash - Deploy hash.
   * @param {String} stateKey - State key.
   * @param {Array} statePath - State path.
   * @return {Object} State Value.
   */
  getStateValue = async (
    stateRootHash: string,
    stateKey: string,
    statePath: string[],
  ) => {
    return await this.casperClient.nodeClient.getBlockState(
      stateRootHash,
      stateKey,
      statePath,
    );
  };

  /**
   * Returns value of a key associated with global storage.
   * @param {String} stateRootHash - Root hash of global state at a recent block.
   * @param {String} stateKey - Key of an item within global state.
   * @param {String} statePath - Path of data associated with a key within a global state.
   * @return {Object} On-chain account information.
   */
  getStateKeyValue = async (
    stateRootHash: string,
    stateKey: string,
    statePath: string,
  ) => {
    // Chain query: get global state key value.
    const clValue = await this.getStateValue(stateRootHash, stateKey, [
      statePath,
    ]);

    return clValue.CLValue?.data;
  };

  /**
   * Returns values of a key associated with global storage.
   * @param {String} stateRootHash - Root hash of global state at a recent block.
   * @param {String} stateKey - Key of an item within global state.
   * @param {Array} statePaths - List of Path of data associated with a key within a global state.
   * @return {Object} On-chain account information.
   */
  getStateKeysValue = async (
    stateRootHash: string,
    stateKey: string,
    statePaths: string[],
  ) => {
    let value: any = {};
    await Promise.all(
      statePaths.map(async (statePath) => {
        const stateValue = await this.getStateKeyValue(
          stateRootHash,
          stateKey,
          statePath,
        );
        value[statePath] = stateValue;
      }),
    );
    return value;
  };

  /**
   * Parse public key to CL value to query on-chain.
   * @param {CLPublicKey} publicKey - Root hash of global state at a recent block.
   * @return {CLKey} CL value.
   */
  createRecipientAddress = (publicKey: CLPublicKey) => {
    try {
      return new CLKey(new CLAccountHash(publicKey.toAccountHash()));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * Get base64 value of account hash
   * @param {String} publicKey - Public key.
   * @return {String} Base64 value.
   */
  getAccountHashBase64 = (publicKey: CLPublicKey) => {
    const key = this.createRecipientAddress(publicKey);
    const keyBytes = CLValueParsers.toBytes(key).unwrap();
    return Buffer.from(keyBytes).toString('base64');
  };

  /**
   * get dictionary value
   * @param {String} stateRootHash - Root hash of global state at a recent block.
   * @param {String} dictionaryItemKey - dictionary item key.
   * @param {String} seedUref - Uref.
   * @return {Object} Dictionary value.
   */
  dictionaryValueGetter = async (
    stateRootHash: string,
    dictionaryItemKey: string,
    seedUref: string,
  ) => {
    try {
      const storedValue =
        await this.casperClient.nodeClient.getDictionaryItemByURef(
          stateRootHash,
          dictionaryItemKey,
          seedUref,
        );
      return storedValue && storedValue.CLValue
        ? storedValue.CLValue.value()
        : {};
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Get contract named key uref
   * @param  stateRootHash - Root hash of global state at a recent block.
   * @param  contractHash - Contract hash.
   * @param  namedKeys - list named key.
   * @return  Dictionary value.
   */
  // getContractNamedKeyUref = async (
  //   stateRootHash: string,
  //   contractHash: string,
  //   namedKeys: string[] = [],
  // ) => {
  //   // contract hash must be formatted with hash- prefix before querying data
  //   const formattedContractHash = `hash-${contractHash}`;
  //   const stateValue = await this.getStateValue(
  //     stateRootHash,
  //     formattedContractHash,
  //     [],
  //   );
  //   const { Contract } = stateValue;
  //   return Contract && Contract.namedKeys && Contract.namedKeys.length
  //     ? Contract.namedKeys.filter((namedKey) =>
  //         namedKeys.includes(namedKey.name),
  //       )
  //     : [];
  // };
}
