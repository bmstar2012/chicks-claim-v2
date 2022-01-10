import { Coder } from '@project-serum/anchor';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const idl = require('./merkle_distributor.json');

export const coder = new Coder(idl);
