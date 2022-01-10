/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation
} from "react-router-dom";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {
  Container,
  Step,
  StepButton,
  StepContent,
  Stepper,
  Typography,
} from '@material-ui/core';
import NumberFormat from 'react-number-format';
import {CHAIN_ID_SOLANA, ChainId} from '../lib/consts';
import useClaim, {
  ClaimErrorCode,
  ClaimStatusCode,
} from '../hooks/useClaim';
import StepDescription from '../components/StepDescription';
import { useStyles } from './useStyles';
import ShowTx from '../components/ShowTx';
import ConsoleHelper from '../helpers/ConsoleHelper';
import {useSolanaWallet} from "../contexts/SolanaWalletContext";
import SolanaCreateAssociatedAddress, {
  useAssociatedAccountExistsState,
} from '../components/SolanaCreateAssociatedAddress';
import KeyAndBalance from "../components/KeyAndBalance";
import {toTokenBalanceString} from "../utils/solchickHelper";

// eslint-disable-next-line @typescript-eslint/ban-types
function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export const ClaimView = () => {
  const classes = useStyles();
  const [transactionId, setTransactionId] = useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const { publicKey: solanaAddress } = useSolanaWallet();
  const { associatedAccountExists, setAssociatedAccountExists } =
    useAssociatedAccountExistsState(CHAIN_ID_SOLANA);

  // eslint-disable-next-line react/destructuring-assignment
  const query = useQuery();
  const searchParams = useMemo(() => {
    const distributor = query.get('distributor');
    const amount = query.get('amount');
    const handle = query.get('handle');
    const proof = query.get('proof');
    const index = query.get('index');
    return {
      distributor,
      amount,
      handle,
      proof,
      index,
    }
  }, [query]);
  const [distributor, setDistributor] = React.useState(query.get('distributor') || "");
  ConsoleHelper("searchParams", searchParams);
  const {
    claim, isProcessing, statusCode, errorCode, lastError,
    targetTxId,
  } = useClaim();

  const onClaim = async () => {
    claim();
  };
  const amountTxt = toTokenBalanceString(BigInt(searchParams.amount || ''), CHAIN_ID_SOLANA);

  ConsoleHelper("solanaAddress", solanaAddress);

  const inputTargetAmount = '1.2';

  const statusMessage = useMemo(() => {
    if (isProcessing || statusCode !== ClaimStatusCode.FAILED) {
      switch (statusCode) {
        case ClaimStatusCode.START:
          return 'Start';
        case ClaimStatusCode.RECEIVING:
          return 'Receiving token';
        case ClaimStatusCode.SUCCESS:
          return 'Success';
        default:
          return '';
      }
    } else {
      switch (errorCode) {
        case ClaimErrorCode.TOKEN_AMOUNT_NOT_ENOUGH:
          return 'Token is not enough';
        case ClaimErrorCode.INVALID_TARGET_ADDRESS:
          return 'Invalid target address';
        case ClaimErrorCode.CLAIM_FAILED:
          return lastError && lastError > '' ? lastError : 'Unknown error';
        default:
          return '';
      }
    }
  }, [isProcessing, statusCode, errorCode, lastError]);

  useEffect(() => {
    if (!isProcessing) {
      if (statusCode === ClaimStatusCode.SUCCESS) {
        setSuccessMessage('Success');
      } else if (statusCode === ClaimStatusCode.FAILED) {
        setErrorMessage(statusMessage);
      }
    }
  }, [isProcessing, statusCode, statusMessage, errorCode]);

  ConsoleHelper(successMessage);
  ConsoleHelper(errorMessage);

  return (
    <>
      <Container className='container'>
        <Stepper orientation='vertical' className='step'>
          <Step expanded>
            <StepButton>
              <span className='step-btn-title'>Claim</span>
            </StepButton>
            <StepContent>
              <NumberFormat
                customInput={TextField}
                label='Token Amount'
                disabled
                value={amountTxt}
              />
              <br/>
              <br/>
              <KeyAndBalance chainId={CHAIN_ID_SOLANA} />
              <div>
              {!associatedAccountExists && (
                <div style={{ paddingTop: '20px', width: '32rem' }}>
                  <SolanaCreateAssociatedAddress
                    associatedAccountExists={associatedAccountExists}
                    setAssociatedAccountExists={
                      setAssociatedAccountExists
                    }
                  />
                </div>
              )}
              </div>
              <br/>
              <div>
                <div className={classes.chainSelectWrapper}>
                  {(targetTxId > '') ?
                    <ShowTx chainId={CHAIN_ID_SOLANA} txId={targetTxId} /> : null}
                </div>
                <div className='step-btn-wallet-container'>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={onClaim}
                    disabled={isProcessing}
                    style={{ width: '15rem' }}
                  >
                    {isProcessing ? 'Processing' : 'Claim'}
                  </Button>
                </div>
                {statusMessage ? (
                  <Typography
                    variant='body2'
                    color='primary'
                    className={classes.statusMessage}
                  >
                    {statusMessage}
                  </Typography>
                ) : null}
              </div>
            </StepContent>
          </Step>
        </Stepper>
      </Container>
    </>
  );
};
