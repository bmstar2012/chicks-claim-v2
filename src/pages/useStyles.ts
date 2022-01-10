import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((theme) => ({
  chainSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
  chainSelectContainer: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
  },
  chainSelectArrow: {
    position: 'relative',
    top: '12px',
    [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' },
  },
  chainStepCaption: {
    fontFamily: 'Bergern, Poppins, sans-serif',
    display: 'flex',
    alignItems: 'center',
  },
  transferField: {
    marginTop: theme.spacing(5),
  },
  statusMessage: {
    marginTop: theme.spacing(1),
  },
}));
