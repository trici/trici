import { createStyles } from '@mantine/core';

export const HiddenTitleBar: React.FC = () => {
  const useStyles = createStyles((theme: Theme) => ({
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 32,
      backgroundColor: 'transparent',
      zIndex: 1000,
      WebkitAppRegion: 'drag',
    },
  }));

  const { classes } = useStyles();
  return <div className={classes.root} />;
};
