import { CEP78Contract } from '@casperdash/cep78-client';
import { CLPublicKey, Keys } from 'casper-js-sdk';
import axios from 'axios';
import path from 'path';
import { DeployUtil } from 'casper-js-sdk';
import { runDeployFlow } from '../utils/deploy';
import TransferWasm from '../wasm/transfer_call.wasm';

const MINTER = Keys.Ed25519.parseKeyFiles(
  path.join(__dirname, `../keys/master_public.pem`),
  path.join(__dirname, `../keys/master_private.pem`)
);


const transfer = async () => {
  console.log('MINTER.publicKey: ', MINTER.publicKey.toHex());

    const cep78Contract = new CEP78Contract(
        'casper-test', 
        'hash-ce5ab65523312ed33b9f830dee1ec78de73e561caf1a58b5642e9e6a9210c417',
        );

    const clToPublicKey = CLPublicKey.fromHex('01ce62c06f9e6739d06c346cd1003ef80949a61d345c3e8293ea23e0f1d7f04035');
    
    const registerDeployTwo = cep78Contract.register(
      {
        tokenOwner: clToPublicKey,
      },
      "1000000000",
      MINTER.publicKey,
      [MINTER],
    );

    console.log('TransferWasm: ', TransferWasm); 

    const transferDeploy = cep78Contract.transfer(
        {
          tokenId: "4",
          source: MINTER.publicKey,
          target: clToPublicKey,
        },
        { useSessionCode: true },
        "20000000000",
        MINTER.publicKey,
        [],
        TransferWasm
      );

    

    console.log('DeployUtil.deployToJson(transferDeploy as any): ', DeployUtil.deployToJson(transferDeploy as any));
      
    // const response = await axios.post('http://localhost:3001/deploy', DeployUtil.deployToJson(transferDeploy as any));

    // console.log('response: ', response);

    // if (deploy.err) {
    //     throw Error('Deploy failed');
    // }

    await runDeployFlow(DeployUtil.signDeploy(transferDeploy, MINTER));
}

transfer();