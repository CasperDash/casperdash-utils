import { CLPublicKey } from 'casper-js-sdk';
import NFTServices from './NFTServices';
import { NFTStandard, NFTMetadataKind } from '../types';

const NFT_CONFIG = [
  {
    contractHash:
      'hash-1ff9e5f82eb5b35a7af92f668774156162d54a890ee2ad246e1025433cc6c756',
    name: 'Dragon NFT',
    symbol: 'DRAG',
    creator:
      '0202423dfbce6d36354b3978907d4e1db377511f8fece4e5b32d9adbdb903c76914d',
    cep: NFTStandard.CEP47,
  },
  {
    contractHash:
      'hash-adcb6ca823f085bf9eb819d9a6187dba0686697336a216f235ce88b2fdf0d314',
    name: 'Dragon NFT',
    symbol: 'DRAG',
    creator:
      '0202423dfbce6d36354b3978907d4e1db377511f8fece4e5b32d9adbdb903c76914d',
    cep: NFTStandard.CEP78,
    action: 'Hatch',
    metadataKind: NFTMetadataKind.NFT721,
  },
];

jest.setTimeout(60 * 1000);
test('Should call CasperServices', async () => {
  const publicKey = CLPublicKey.fromHex(
    '0202423dfbce6d36354b3978907d4e1db377511f8fece4e5b32d9adbdb903c76914d',
  );
  const NFTInfo = await Promise.all(
    NFT_CONFIG.map(async (config) => {
      const nftServices = new NFTServices(
        'http://65.21.237.153:7777/rpc',
        config,
      );
      const nftContractInfo = await nftServices.getContractInfo();
      try {
        const tokenIds = await nftServices.getTokenIdsByPublicKey(publicKey);
        return await nftServices.getNFTInfoByTokenId(publicKey, tokenIds, {
          ...nftContractInfo,
          balances: tokenIds.length,
        });
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );
  console.info(NFTInfo.flat());
});
