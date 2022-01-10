import { useState } from 'react';
import {CHAIN_ID_NONE, ChainId} from '../lib/consts';
import ConsoleHelper from '../helpers/ConsoleHelper';

export enum ClaimStatusCode {
  NONE = 0,
  START,
  RECEIVING,
  SUCCESS,
  FAILED = 101,
}

export enum ClaimErrorCode {
  NO_ERROR,
  INVALID_TARGET_ADDRESS,
  TOKEN_AMOUNT_NOT_ENOUGH,
  CLAIM_FAILED,
}

interface IClaimStatus {
  claim(): void;

  isProcessing: boolean;
  statusCode: ClaimStatusCode;
  errorCode: ClaimErrorCode;
  lastError: string | null;
  targetChain: ChainId;
  targetTxId: string;
}

const createRedeemStatus = (
  claim: () => void,
  isProcessing: boolean,
  statusCode = ClaimStatusCode.NONE,
  errorCode: ClaimErrorCode,
  lastError: string | null,
  targetChain: ChainId,
  targetTxId: string
) => ({
  claim,
  isProcessing,
  statusCode,
  errorCode,
  lastError,
  targetChain,
  targetTxId
});

function useClaim(): IClaimStatus {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusCode, setStatusCode] = useState(ClaimStatusCode.NONE);
  const [targetTxId, setTargetTxId] = useState('');
  const [targetChain, setTargetChain] = useState(CHAIN_ID_NONE);
  const [errorCode, setErrorCode] = useState(ClaimErrorCode.NO_ERROR);
  const [lastError, setLastError] = useState('');

  const setError = (error: ClaimErrorCode) => {
    setStatusCode(ClaimStatusCode.FAILED);
    setErrorCode(error);
    setIsProcessing(false);
  };

  // const sendRedeem = async (sChainId: ChainId, sTxId: string) => {
  //   setTargetTxId('');
  //   const url = URL_REDEEM(sChainId, sTxId);
  //   setIsProcessing(true);
  //   setStatusCode(ClaimStatusCode.START);
  //   ConsoleHelper(`sendRedeem -> url: ${url}`);
  //
  //   axios.get(url).then(
  //     (results) => {
  //       ConsoleHelper(`sendRedeem -> validator result: ${results}`);
  //       if (results.data.success) {
  //         setStatusCode(ClaimStatusCode.SUCCESS);
  //         setIsProcessing(false);
  //         setTargetTxId(results.data.result_tx_id);
  //         setTargetChain(parseInt(results.data.to_chain_id, 10) as ChainId);
  //       } else {
  //         const errorMessage = results.data.error_message || 'Unknown error';
  //         setLastError(
  //           `${errorMessage} (Error code: ${results.data.error_code})`,
  //         );
  //         setError(ClaimErrorCode.CLAIM_FAILED);
  //       }
  //     },
  //     (error) => {
  //       ConsoleHelper(`sendRedeem -> validator result: ${error}`);
  //       setError(ClaimErrorCode.CLAIM_FAILED);
  //     },
  //   );
  // };

  const claim = async () => {
    // await sendRedeem(sourceChain, sourceTx);
  };

  return createRedeemStatus(
    claim,
    isProcessing,
    statusCode,
    errorCode,
    lastError,
    targetChain,
    targetTxId
  );
}

export default useClaim;
