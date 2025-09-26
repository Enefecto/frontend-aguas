import React from 'react';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

export const CustomSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 46,
  height: 28,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transition: theme.transitions.create(['transform'], {
      duration: 260,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }),
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#0891b2',
        opacity: 1,
        border: 0,
      },
      '& .MuiSwitch-thumb': {
        transform: 'scale(1.02)',
        boxShadow: '0 2px 6px rgba(2,132,199,.45)',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 24,
    height: 24,
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: 260,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 28 / 2,
    backgroundColor: '#cbd5e1',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'opacity'], {
      duration: 260,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
  '& .MuiSwitch-switchBase:active .MuiSwitch-thumb': {
    transform: 'scale(0.96)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& .MuiSwitch-switchBase': { transition: 'none' },
    '& .MuiSwitch-thumb': { transition: 'none' },
    '& .MuiSwitch-track': { transition: 'none' },
  },
}));