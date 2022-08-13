import { CLPublicKey } from 'casper-js-sdk';
import NFTServices from './NFTServices';
import { NFTStandard, NFTMetadataKind } from '../types';

const NFT_CONFIG = [
  // {
  //   contractHash:
  //     'hash-1ff9e5f82eb5b35a7af92f668774156162d54a890ee2ad246e1025433cc6c756',
  //   name: 'Dragon NFT',
  //   symbol: 'DRAG',
  //   creator:
  //     '0202423dfbce6d36354b3978907d4e1db377511f8fece4e5b32d9adbdb903c76914d',
  //   cep: NFTStandard.CEP47,
  // },
  {
    contractHash:
      'hash-80a7c1e6cf552d69369ed5c351e0968ef00c42f355a6a9ba50f390d28a2609c1',
    name: 'Dragon NFT',
    symbol: 'DRAG',
    creator:
      '0187e7fdf8346cc5bd7f43a93a5654ea946e7bdc986502a6675d4573b26322e1ba',
    cep: NFTStandard.CEP78,
    action: 'Hatch',
    metadataKind: NFTMetadataKind.Raw,
  },
];

jest.setTimeout(60 * 1000);
test('Should call CasperServices', async () => {
  const publicKey = CLPublicKey.fromHex(
    '02021172744b5e6bdc83a591b75765712e068e5d40a3be8ae360274fb26503b4ad38',
  );
  console.info(publicKey.toAccountHashStr());
  const NFTInfo = await Promise.all(
    NFT_CONFIG.map(async (config) => {
      const nftServices = new NFTServices(
        'http://65.21.237.153:7777/rpc',
        config,
      );
      const nftContractInfo = await nftServices.getContractInfo();
      try {
        const tokenIds = await nftServices.getTokenIdsByPublicKey(publicKey);
        return await nftServices.getNFTInfoByTokenId(tokenIds, {
          ...nftContractInfo,
          balances: tokenIds.length,
        });
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );
  console.info(NFTInfo);
});
