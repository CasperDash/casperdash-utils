import {
  CLAccountHash,
  CLPublicKey,
  CLValue,
  CLValueBuilder,
  Contracts,
} from 'casper-js-sdk';
import { keyAndValueToHex } from '../utilities/valueBuilder';
import {
  INFTConfig,
  AttributesConfig,
  NFTMetadataKind,
  NFTStandard,
  NamedKeyConfig,
} from '../types/types';
import CasperServices from './CasperServices';

const OWNED_TOKENS_BY_INDEX_NAMED_KEY = 'owned_tokens_by_index';
const BALANCES_NAMED_KEY = 'balances';
const METADATA_NAMED_KEY = 'metadata';

const CEP_47_NAMED_KEYS = [
  { key: 'symbol', name: 'symbol' },
  { key: 'name', name: 'name' },
  { key: 'total_supply', name: 'totalSupply' },
];
const CEP_78_NAMED_KEY = [
  { key: 'collection_symbol', name: 'symbol' },
  { key: 'collection_name', name: 'name' },
  { key: 'total_token_supply', name: 'totalSupply' },
];

const metadataNamedKeyMapping = {
  [NFTMetadataKind.CEP78]: 'metadata_cep78',
  [NFTMetadataKind.NFT721]: 'metadata_nft721',
  [NFTMetadataKind.Raw]: 'metadata_raw',
  [NFTMetadataKind.CustomValidated]: 'metadata_custom_validated',
};

const getMetadataNamedKey = (cep: string, metadataKind?: NFTMetadataKind) => {
  return cep === NFTStandard.CEP47 ||
    metadataKind === undefined ||
    metadataKind === null
    ? METADATA_NAMED_KEY
    : metadataNamedKeyMapping[metadataKind];
};

const getNamedKeyConfig = (
  cep: NFTStandard,
  tokenId: string,
  metadataKind?: NFTMetadataKind,
): NamedKeyConfig[] => {
  return [
    {
      namedKey: getMetadataNamedKey(cep, metadataKind),
      key: tokenId,
      originNamedKey: METADATA_NAMED_KEY,
    },
    {
      namedKey: cep === NFTStandard.CEP47 ? 'owners' : 'token_owners',
      key: tokenId,
      originNamedKey: 'ownerAccountHash',
      massageFn: (value: CLAccountHash) => {
        const hex = Buffer.from(value.data).toString('hex');
        return `account-hash-${hex}`;
      },
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
  getMetadataFromUri = async (metadata: any[], namedKeys?: NamedKeyConfig) => {
    const uri = metadata.find(
      (data) => data.key === namedKeys?.metadata?.uri.key,
    );

    if (uri) {
      return await namedKeys?.metadata?.uri?.massageFnc?.(uri.value);
    } else {
      throw Error('Cant find uri');
    }
  };
  massageMetadata = (detail: any, namedKeys?: NamedKeyConfig) => {
    try {
      return Array.isArray(detail)
        ? detail.map((value) =>
            this.getAttributeConfig(
              namedKeys?.metadata?.attributes,
              value[0].data,
              value[1].data,
            ),
          )
        : this.getObjectAttributeValueConfig(
            namedKeys?.metadata?.attributes,
            JSON.parse(detail),
          );
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  /* Getting the token details for each token id. */
  getNFTDetails = async (tokenId: string) => {
    const { name, namedKeys, creator, action, cep, metadataKind } =
      this.NFTConfig || {};

    const newKeys =  Object.keys(namedKeys || {})
    .filter((key) => key !== 'metadata')
    .map((namedKey) => ({
      namedKey,
      key: tokenId,
      originNamedKey: namedKey,
    }));

    const tokenNamedKeys = getNamedKeyConfig(cep, tokenId, metadataKind).concat(
      [...newKeys]
    ).filter((namedKey) => namedKey.namedKey);

    const tokenDetails = await Promise.all(
      tokenNamedKeys.map(async ({ namedKey, key, massageFn }) => {
        const value: any = await this.contractClient.queryContractDictionary(
          namedKey!,
          key!,
        );
        const maybeValue = value.data;

        const data = maybeValue?.some ? maybeValue?.unwrap().data : maybeValue;
        if (massageFn) {
          return massageFn(data);
        }
        return data;
      }),
    );

    const details = tokenDetails.reduce(
      (out, detail, index) => {
        const namedKey =
          tokenNamedKeys[index].originNamedKey ||
          tokenNamedKeys[index].namedKey;

        return {
          ...out,
          [namedKey!]:
            namedKey === METADATA_NAMED_KEY
              ? this.massageMetadata(detail, namedKeys)
              : detail,
        };
      },
      {
        tokenId,
        contractName: name,
        contractAddress: this.nftContractHash,
        creator,
        metadata: [],
        action,
      },
    );
    if (namedKeys?.metadata?.isFromURI) {
      const metadataFromUri = await this.getMetadataFromUri(
        details.metadata,
        namedKeys,
      );

      details.metadata = metadataFromUri;
    }
    return { ...details, action: this.NFTConfig.action };
  };

  /* Getting the token details for each token id. */
  getNFTInfoByTokenId = async (tokenIds: string[], nftContractInfo: any) => {
    return tokenIds.length
      ? await Promise.all(
          tokenIds.map(async (tokenId) => {
            try {
              const tokenInfos = await this.getNFTDetails(tokenId.toString());
              return { ...tokenInfos, ...nftContractInfo };
            } catch (error) {
              console.error(error);
              return { ...nftContractInfo, tokenId };
            }
          }),
        )
      : [];
  };

  /* Getting the contract info. */
  getContractInfo = async () => {
    let result: any = {};
    await Promise.all(
      this.NFTInfoNamedKeys.map(async ({ name, key }) => {
        let value;
        try {
          value = await this.contractClient.queryContractData([key]);
        } catch (error) {
          console.error(error);
          value = null;
        }
        result[name] = value;
      }),
    );

    return result;
  };

  /* Getting the NFT details for a given token id. */
  getMyNFTDetail = async (tokenId: string) => {
    const detail = await this.getNFTDetails(tokenId);
    return detail;
  };

  getNFTByPublicKey = async (publicKey: CLPublicKey, nftContractInfo: any) => {
    const tokenIds = await this.getTokenIdsByPublicKey(publicKey);

    return await this.getNFTInfoByTokenId(tokenIds, {
      ...nftContractInfo,
      balances: tokenIds.length,
    });
  };
}
