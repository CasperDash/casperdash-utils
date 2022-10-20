import { CLPublicKey } from 'casper-js-sdk';
import NFTServices from './NFTServices';
import { NFTStandard, NFTMetadataKind } from '../types';

const massageIPFSURI = (uri: string) => {
  return typeof uri === 'string'
    ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : '';
};
const massageDotOracleURIMetadata = async (uri: string) => {
  const url = massageIPFSURI(uri);
  const response = await fetch(url);
  const data = await response.json();
  return [
    { key: 'image', name: 'image', value: massageIPFSURI(data.image) },
  ].concat(
    Array.isArray(data.attributes)
      ? data.attributes.map((attribute: any) => {
          const key = attribute.trait_type;
          return { key, name: key, value: attribute.value };
        })
      : [],
  );
};

const NFT_CONFIG = [
  {
    contractHash:
      'hash-f4a75b1a0c1858bc4883165441107e0d23756e4ebdbd558918ad39231f1c7728',
    name: 'CasperDash',
    symbol: 'CDAS',
    //creator: '0202423dfbce6d36354b3978907d4e1db377511f8fece4e5b32d9adbdb903c76914d',
    cep: NFTStandard.CEP47,
  },
  {
    contractHash:
      'hash-68d05b72593981f73f5ce7ce5dcac9033aa0ad4e8c93b773f8b939a18c0bbc3b',
    name: 'CEP78 Faucet',
    symbol: 'CEPF',
    creator:
      '020261207299a7d59261d28a0780b92f76b5caff3ee2e3f767d7cd832e269c181767',
    cep: NFTStandard.CEP78,
    metadataKind: NFTMetadataKind.CEP78,
    namedKeys: {
      metadata: {
        isFromURI: true,
        uri: { key: 'token_uri', massageFnc: massageDotOracleURIMetadata },
      },
    },
  },
  // {
  //   contractHash:
  //     'hash-80a7c1e6cf552d69369ed5c351e0968ef00c42f355a6a9ba50f390d28a2609c1',
  //   name: 'Dragon NFT',
  //   symbol: 'DRAG',
  //   creator:
  //     '010976375952ee6b58e8919db4a741274e6c584b6cf09c9fcbdf31f27fe2f61fd0',
  //   cep: NFTStandard.CEP78,
  //   metadataKind: NFTMetadataKind.Raw,
  // },
];

jest.setTimeout(60 * 1000);
test('Should call CasperServices', async () => {
  const publicKey = CLPublicKey.fromHex(
    '0160d88b3f847221f4dc6c5549dcfc26772c02f253a24de226a88b4536bc61d4ad',
  );
  console.info(publicKey.toAccountHashStr());
  const NFTInfo = await Promise.all(
    NFT_CONFIG.map(async (config) => {
      const nftServices = new NFTServices(
        'http://65.21.235.219:7777/rpc',
        config,
      );
      const nftContractInfo = await nftServices.getContractInfo();
      console.info(nftContractInfo);
      try {
        const tokenIds = await nftServices.getTokenIdsByPublicKey(publicKey);
        console.info('tokenIds', tokenIds);
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
  console.info(NFTInfo.flat());
});
