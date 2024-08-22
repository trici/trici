/**
 * Customized Mantine theme for the desktop app
 * This is using Mantine 6.0.21. In the newer version there is a createTheme
 * method. But upgrading will break a bunch of things.
 */

/**
 * Color Palette for Mantine theme
 * created using https://palx.jxnblk.com/
 * with #0075ea as base color
 */
const triciColors = {
  gray: ['#f9f9fa', '#eceef0', '#dee1e4', '#cfd3d8', '#bec5cb', '#acb4bc', '#97a1ab', '#7e8b97', '#606e7c', '#384048'],
  blue: ['#f6fafe', '#e2effd', '#cce3fb', '#b4d7f9', '#9ac8f7', '#7bb8f4', '#57a4f1', '#288bed', '#006ad4', '#003f7d'],
  indigo: [
    '#f9f9fe',
    '#ececfd',
    '#dedefc',
    '#cfcffb',
    '#bfbffa',
    '#acacf8',
    '#9696f6',
    '#7b7bf4',
    '#5656f1',
    '#0000d9',
  ],
  violet: [
    '#fbf8fe',
    '#f4eafd',
    '#ebdafc',
    '#e2c9fb',
    '#d8b6f9',
    '#cca1f7',
    '#be87f5',
    '#ad67f2',
    '#9236ee',
    '#5600ad',
  ],
  fuschia: [
    '#fef7fe',
    '#fde7fd',
    '#fcd5fc',
    '#fac0fa',
    '#f8a9f8',
    '#f68cf6',
    '#f267f2',
    '#ed1fed',
    '#c000c0',
    '#740074',
  ],
  pink: ['#fef8fb', '#fde8f2', '#fcd7e9', '#fac4df', '#f8aed3', '#f694c5', '#f474b4', '#f0459a', '#d4006a', '#800040'],
  red: ['#fef8f8', '#fde9e9', '#fcd8d8', '#fac6c6', '#f9b2b2', '#f79a9a', '#f47c7c', '#f15050', '#db0000', '#850000'],
  orange: [
    '#fef9f3',
    '#fcebda',
    '#fadcbe',
    '#f7cb9f',
    '#f4b87c',
    '#f1a253',
    '#ed861f',
    '#d76b00',
    '#aa5500',
    '#643200',
  ],
  yellow: [
    '#fcfcd7',
    '#f4f476',
    '#e8e800',
    '#dada00',
    '#caca00',
    '#b9b900',
    '#a5a500',
    '#8e8e00',
    '#707000',
    '#424200',
  ],
  lime: ['#f2fde7', '#d5f9b2', '#b2f371', '#83ec1a', '#6edd00', '#65ca00', '#5ab400', '#4d9b00', '#3d7a00', '#244800'],
  green: ['#eefeee', '#c8fac8', '#97f697', '#50f150', '#00e300', '#00d000', '#00ba00', '#00a000', '#007e00', '#004b00'],
  teal: ['#ecfdf5', '#c2fade', '#8cf6c1', '#3eef96', '#00e170', '#00ce67', '#00b85c', '#009e4f', '#007d3e', '#004a25'],
  cyan: ['#eafdfd', '#b9f9f9', '#77f4f4', '#04eaea', '#00dada', '#00c7c7', '#00b2b2', '#009999', '#007979', '#004747'],
};

export const triciThemeOverride = {
  colors: triciColors,
  primaryColor: 'blue',
};
