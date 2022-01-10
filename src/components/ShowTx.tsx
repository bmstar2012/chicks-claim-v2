import React from 'react';
import { Button, makeStyles, Typography } from "@material-ui/core";
import {
  ChainId
} from "../lib/consts";
import { getExplorerName, getExplorerAddress } from "../utils/consts";

const useStyles = makeStyles((theme) => ({
  tx: {
    marginTop: theme.spacing(1),
    textAlign: "left",
  },
  viewButton: {
    marginTop: theme.spacing(1),
  },
}));

export default function ShowTx({
  chainId,
  txId,
}: {
  chainId: ChainId;
  txId: string;
}) {
  const classes = useStyles();

  const explorerAddress = getExplorerAddress(chainId, txId);
  const explorerName = getExplorerName(chainId);

  return (
    <div className={classes.tx}>
      <Typography noWrap component="div" variant="body2">
        {txId}
      </Typography>
      {explorerAddress ? (
        <Button
          href={explorerAddress}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="outlined"
          className={classes.viewButton}
        >
          View on {explorerName}
        </Button>
      ) : null}
    </div>
  );
}
