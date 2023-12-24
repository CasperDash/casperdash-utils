import { MarketContract } from '@casperdash/jasper-client';
import { CLPublicKey} from 'casper-js-sdk';

const transfer = () => {
    const marketContract = new MarketContract(
        'casper-test', 
        'hash-c39ac4b3e174b0dc4063e3b482e8c27ffdc59c9c14591ef7c9738f0b1059a8d6',
        'hash-5814ea56a814deb8f4057a5233788b6e87a1b6b9740ca47582772b13c147fea3'
        );

    const clFromPublicKey = CLPublicKey.fromHex('013f2770f56d8482c6bd38d0ce28e164bbd00a6094445e406c5a0b44a19400a706');
    const clToPublicKey = CLPublicKey.fromHex('01ce62c06f9e6739d06c346cd1003ef80949a61d345c3e8293ea23e0f1d7f04035');
  
    
    return '';
    
}

transfer();