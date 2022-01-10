import {
  Blockhash,
  Commitment,
  Connection,
  FeeCalculator,
  Keypair,
  RpcResponseAndContext,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';

interface BlockhashAndFeeCalculator {
  blockhash: Blockhash;
  feeCalculator: FeeCalculator;
}

export const DEFAULT_TIMEOUT = 15000;

export const getUnixTs = () => new Date().getTime() / 1000;

export const envFor = (connection: Connection): string => {
  // eslint-disable-next-line no-underscore-dangle
  const endpoint = (connection as any)._rpcEndpoint;
  const regex = /https:\/\/api.([^.]*).solana.com/;
  const match = endpoint.match(regex);
  if (match[1]) {
    return match[1];
  }
  return 'mainnet-beta';
};

export const explorerLinkFor = (
  txid: TransactionSignature,
  connection: Connection,
): string => `https://explorer.solana.com/tx/${txid}?cluster=${envFor(connection)}`;

export const sendTransactionWithRetryWithKeypair = async (
  connection: Connection,
  wallet: Keypair,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  commitment: Commitment = 'singleGossip',
  includesFeePayer = false,
  block?: BlockhashAndFeeCalculator,
  beforeSend?: () => void,
) => {
  const transaction = new Transaction();
  instructions.forEach(instruction => transaction.add(instruction));
  transaction.recentBlockhash = (
    block || (await connection.getRecentBlockhash(commitment))
  ).blockhash;

  if (includesFeePayer) {
    transaction.setSigners(...signers.map(s => s.publicKey));
  } else {
    transaction.setSigners(
      // fee payed by the wallet owner
      wallet.publicKey,
      ...signers.map(s => s.publicKey),
    );
  }

  if (signers.length > 0) {
    transaction.sign(...[wallet, ...signers]);
  } else {
    transaction.sign(wallet);
  }

  if (beforeSend) {
    beforeSend();
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const { txid, slot } = await sendSignedTransaction({
    connection,
    signedTransaction: transaction,
  });

  return { txid, slot };
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
}): Promise<{ txid: string; slot: number }> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  let txid: TransactionSignature;

  try {
    txid = await connection.sendRawTransaction(
      rawTransaction,
      {
        skipPreflight: true,
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const confirmation = await awaitTransactionSignatureConfirmation(
      txid,
      timeout,
      connection,
      'confirmed',
      true,
    );

    if (!confirmation)
      throw new Error('Timed out awaiting confirmation on transaction');

    if (confirmation.err) {
      throw new Error('Transaction failed: Custom instruction error');
    }

    slot = confirmation?.slot || 0;
  } catch (err) {
    console.log("error: 137", err);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (err.timeout) {
      throw new Error('Timed out awaiting confirmation on transaction');
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await simulateTransaction(connection, signedTransaction, 'single')
      ).value;
    } catch (e) {
      console.log("error: 149", e);
    }
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        // eslint-disable-next-line no-plusplus
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith('Program log: ')) {
            throw new Error(
              `Transaction failed: ${  line.slice('Program log: '.length)}`,
            );
          }
        }
      }
      throw new Error(JSON.stringify(simulateResult.err));
    }
    // throw new Error('Transaction failed');
  } finally {
  }
  return { txid: "", slot: 0 };


}

async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  transaction.recentBlockhash = await connection._recentBlockhash(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    connection._disableBlockhashCaching,
  );

  const signData = transaction.serializeMessage();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error(`failed to simulate transaction: ${  res.error.message}`);
  }
  return res.result;
}

export async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = 'recent',
  queryStatus = false,
): Promise<SignatureStatus | null | void> {
  let done = false;
  let status: SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  // eslint-disable-next-line no-async-promise-executor
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result, context) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            reject(status);
          } else {
            resolve(status);
          }
        },
        commitment,
      );
    } catch (e) {
      done = true;
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
            } else if (status.err) {
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
            } else {
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
          }
        }
      })();
      sleep(2000);
    }
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  if (connection._signatureSubscriptions[subId])
    connection.removeSignatureListener(subId);
  done = true;
  return status;
}
