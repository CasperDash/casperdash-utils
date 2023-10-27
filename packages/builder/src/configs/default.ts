import { Keys } from "casper-js-sdk";
import path from 'path';

export const DEFAULT_CONFIGS = {
    NODE_URL: 'http://76.91.193.251:7777',
    NETWORK: 'casper-test',
    SPECULATIVE_NODE_URL: 'http://76.91.193.251:7778/rpc',
}

export const OWNER_KEYS = Keys.Ed25519.parseKeyFiles(
    path.join(__dirname, `./keys/owner_public.pem`),
    path.join(__dirname, `./keys/owner_private.pem`)
);

export const BUYER_KEYS = Keys.Ed25519.loadKeyPairFromPrivateFile(
    path.join(__dirname, `./keys/buyer_private.pem`)
);