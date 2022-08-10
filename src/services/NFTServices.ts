import { CLPublicKey, CLValue, CLValueBuilder, Contracts } from 'casper-js-sdk';
import { keyAndValueToHex } from '../utilities/valueBuilder';
import {
  INFTConfig,
  AttributesConfig,
  NFTMetadataKind,
  NFTStandard,
} from '../types/types';
import CasperServices from './CasperServices';

const OWNED_TOKENS_BY_INDEX_NAMED_KEY = 'owned_tokens_by_index';
const BALANCES_NAMED_KEY = 'balances';
const METADATA_NAMED_KEY = 'metadata';

const CEP_47_NAMED_KEYS = [
  { key: 'symbol', name: 'symbol' },
  { key: 'name', name: 'name' },
  { key: 'total_supply', name: 'total_supply' },
];
const CEP_78_NAMED_KEY = [
  { key: 'collection_symbol', name: 'symbol' },
  { key: 'collection_name', name: 'name' },
  { key: 'total_token_supply', name: 'total_supply' },
];

const metadataNamedKeyMapping = {
  [NFTMetadataKind.CEP78]: 'metadata_cep78',
  [NFTMetadataKind.NFT721]: 'metadata_nft721',
  [NFTMetadataKind.Raw]: 'metadata_raw',
  [NFTMetadataKind.CustomValidated]: 'metadata_custom_validated',
};

const getMetadataNamedKey = (cep: string, metadataKind?: NFTMetadataKind) => {
  return cep === NFTStandard.CEP47 || !metadataKind
    ? METADATA_NAMED_KEY
    : metadataNamedKeyMapping[metadataKind];
};

const getNamedKeyConfig = (
  cep: string = 'cep47',
  tokenId: string,
  metadataKind?: NFTMetadataKind,
) => {
  return [
    {
      namedKey: getMetadataNamedKey(cep, metadataKind),
      key: tokenId,
      originNamedKey: METADATA_NAMED_KEY,
    },
  ];
};

const { Contract } = Contracts;

export default class NFTServices {
  RPC_URL: string;
  casperServices: CasperServices;
  NFTConfig: INFTConfig;
  nftContractHash: string;
  contractClient: Contracts.Contract;
  NFTInfoNamedKeys: Array<{ name: string; key: string }>;

  constructor(RPC_URL: string, NFTConfig: INFTConfig) {
    this.RPC_URL = RPC_URL;
    this.casperServices = new CasperServices(RPC_URL);
    this.NFTConfig = NFTConfig;
    this.nftContractHash = NFTConfig.contractHash;
    this.contractClient = new Contract(this.casperServices.casperClient);
    this.contractClient.setContractHash(this.nftContractHash);

    this.NFTInfoNamedKeys =
      NFTConfig.cep === NFTStandard.CEP47
        ? CEP_47_NAMED_KEYS
        : CEP_78_NAMED_KEY;
  }

  /* Getting the balance of the account. */
  balanceOf = async (account: CLPublicKey) => {
    const result = await this.contractClient.queryContractDictionary(
      BALANCES_NAMED_KEY,
      account.toAccountHashStr().slice(13),
    );
    const maybeValue = result.value().unwrap();
    return maybeValue.value().toString();
  };

  /* This function is used to get the token ids by public key. */
  getTokenIdsByPublicKey = async (publicKey: CLPublicKey) => {
    try {
      if (this.NFTConfig.cep === NFTStandard.CEP47) {
        const balance = await this.balanceOf(publicKey);

        return await Promise.all(
          new Array(parseInt(balance)).fill(null).map(async (_value, i) => {
            const hex = keyAndValueToHex(
              CLValueBuilder.key(publicKey),
              CLValueBuilder.u256(i),
            );
            const value = await this.contractClient.queryContractDictionary(
              OWNED_TOKENS_BY_INDEX_NAMED_KEY,
              hex,
            );
            const maybeValue = value.value().unwrap();

            return maybeValue.value().toString();
          }),
        );
      } else {
        const value = await this.contractClient.queryContractDictionary(
          'owned_tokens',
          publicKey.toAccountHashStr().slice(13),
        );
        const maybeValue = value.data;
        return maybeValue?.map((vl: CLValue) => vl.data.toString());
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  /* A function that is used to get the attribute config. */
  getAttributeConfig = (
    attributeConf: AttributesConfig[] = [],
    key: string,
    value: any,
  ) => {
    const conf = attributeConf.find((conf) => conf.key === key);
    if (conf) {
      const { massageFnc, strictKey, name } = conf;
      const updatedKey = strictKey || key;
      return {
        name,
        value: typeof massageFnc === 'function' ? massageFnc(value) : value,
        key: updatedKey,
      };
    }

    return { key: key, name: key, value };
  };

  getObjectAttributeValueConfig = (
    attributeConf: AttributesConfig[] = [],
    data: any,
  ) => {
    return Object.keys(data).map((key: string) => {
      const value = data[key];
      return this.getAttributeConfig(attributeConf, key, value);
    });
  };

  /* Getting the token details for each token id. */
  getNFTDetails = async (publicKey: CLPublicKey, tokenId: string) => {
    const { name, namedKeys, creator, action, cep, metadataKind } =
      this.NFTConfig || {};

    const tokenNamedKeys = getNamedKeyConfig(cep, tokenId, metadataKind).concat(
      Object.keys(namedKeys || {}).map((namedKey) => ({
        namedKey,
        key: tokenId,
        originNamedKey: namedKey,
      })),
    );

    const tokenDetails = await Promise.all(
      tokenNamedKeys.map(async ({ namedKey, key }) => {
        const value: any = await this.contractClient.queryContractDictionary(
          namedKey,
          key,
        );
        const maybeValue = value.data;

        const value1 = maybeValue?.some
          ? maybeValue?.unwrap().data
          : maybeValue;
        return value1;
      }),
    );
    const details = tokenDetails.reduce(
      (out, detail, index) => {
        const namedKey = tokenNamedKeys[index].originNamedKey;
        return {
          ...out,
          [namedKey]:
            namedKey === METADATA_NAMED_KEY
              ? Array.isArray(detail)
                ? detail.map((value) =>
                    this.getAttributeConfig(
                      namedKeys?.metadata.attributes,
                      value[0].data,
                      value[1].data,
                    ),
                  )
                : this.getObjectAttributeValueConfig(
                    namedKeys?.metadata.attributes,
                    JSON.parse(detail),
                  )
              : detail,
        };
      },
      {
        tokenId,
        contractName: name,
        contractAddress: this.nftContractHash,
        creator,
        owner: publicKey.toHex(),
        metadata: {},
        action,
      },
    );
    return { ...details, action: this.NFTConfig.action };
  };

  /* Getting the token details for each token id. */
  getNFTInfoByTokenId = async (
    publicKey: CLPublicKey,
    tokenIds: string[],
    nftContractInfo: any,
  ) => {
    return tokenIds.length
      ? await Promise.all(
          tokenIds.map(async (tokenId) => {
            const tokenInfos = await this.getNFTDetails(
              publicKey,
              parseInt(tokenId).toString(),
            );
            return { ...tokenInfos, ...nftContractInfo };
          }),
        )
      : [];
  };

  /* Getting the contract info. */
  getContractInfo = async () => {
    let result: any = {};
    this.NFTInfoNamedKeys.forEach(async ({ name, key }) => {
      let value;
      try {
        value = await this.contractClient.queryContractData([key]);
      } catch (error) {
        console.error(error);
        value = null;
      }
      result[name] = value;
    });

    return result;
  };

  /* Getting the NFT details for a given token id. */
  getMyNFTDetail = async (publicKeyHex: string, tokenId: string) => {
    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    const detail = await this.getNFTDetails(publicKey, tokenId);
    return detail;
  };
}

module.exports = NFTServices;
