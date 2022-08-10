export enum NFTMetadataKind {
  CEP78 = 0,
  NFT721 = 1,
  Raw = 2,
  CustomValidated = 3,
}

export enum NFTStandard {
  CEP78 = 'cep-78',
  CEP47 = 'cep-47',
}

type NamedKeyConfig = {
  metadata: {
    attributes: AttributesConfig[];
  };
};

export type AttributesConfig = {
  key: string;
  name: string;
  massageFnc?: (value: any) => string;
  strictKey?: string;
};

export interface INFTConfig {
  contractHash: string;
  creator?: string;
  name: string;
  symbol?: string;
  namedKeys?: NamedKeyConfig;
  commissions?: { attributes: AttributesConfig[] };
  action?: string;
  cep: NFTStandard;
  metadataKind?: NFTMetadataKind;
}
