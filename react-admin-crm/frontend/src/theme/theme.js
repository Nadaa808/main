import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#A0B8B5', // Dusty Teal
            light: '#B5C9C6',
            dark: '#8FA8A5',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#F7F2E8', // Cream
            light: '#FFFBEF',
            dark: '#E8E0D1',
            contrastText: '#4A5568'
        },
        background: {
            default: '#FFFBEF', // Light cream background
            paper: 'rgba(255, 255, 255, 0.9)' // Semi-transparent white
        },
        text: {
            primary: '#2D3748',
            secondary: '#4A5568'
        },
        success: {
            main: '#48BB78',
            light: '#68D391',
            dark: '#2F855A'
        },
        warning: {
            main: '#ECC94B',
            light: '#F6E05E',
            dark: '#B7791F'
        },
        error: {
            main: '#F56565',
            light: '#FC8181',
            dark: '#C53030'
        },
        info: {
            main: '#4299E1',
            light: '#63B3ED',
            dark: '#2B6CB0'
        },
        grey: {
            50: '#FFFBEF',
            100: '#F7F2E8',
            200: '#E2E8F0',
            300: '#CBD5E0',
            400: '#A0AEC0',
            500: '#718096',
            600: '#4A5568',
            700: '#2D3748',
            800: '#1A202C',
            900: '#171923'
        }
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#2D3748'
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            color: '#2D3748'
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            color: '#2D3748'
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#2D3748'
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#2D3748'
        },
        h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#2D3748'
        },
        body1: {
            fontSize: '1rem',
            color: '#4A5568'
        },
        body2: {
            fontSize: '0.875rem',
            color: '#718096'
        },
        caption: {
            fontSize: '0.75rem',
            color: '#A0AEC0'
        }
    },
    shape: {
        borderRadius: 16
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(160, 184, 181, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(160, 184, 181, 0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(160, 184, 181, 0.15)'
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '12px 24px',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px rgba(160, 184, 181, 0.3)'
                    }
                },
                contained: {
                    background: 'linear-gradient(135deg, #A0B8B5, #8FA8A5)',
                    color: '#FFFFFF',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #8FA8A5, #7E9794)'
                    }
                },
                outlined: {
                    border: '1px solid rgba(160, 184, 181, 0.3)',
                    color: '#A0B8B5',
                    background: 'rgba(160, 184, 181, 0.05)',
                    '&:hover': {
                        background: 'rgba(160, 184, 181, 0.1)',
                        border: '1px solid rgba(160, 184, 181, 0.5)'
                    }
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '20px',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                },
                colorPrimary: {
                    background: 'rgba(160, 184, 181, 0.1)',
                    color: '#A0B8B5'
                },
                colorSuccess: {
                    background: 'rgba(72, 187, 120, 0.1)',
                    color: '#2F855A'
                },
                colorWarning: {
                    background: 'rgba(236, 201, 75, 0.1)',
                    color: '#B7791F'
                },
                colorError: {
                    background: 'rgba(245, 101, 101, 0.1)',
                    color: '#C53030'
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': {
                            borderColor: 'rgba(160, 184, 181, 0.3)'
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(160, 184, 181, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#A0B8B5',
                            boxShadow: '0 0 0 3px rgba(160, 184, 181, 0.1)'
                        }
                    }
                }
            }
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(160, 184, 181, 0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(160, 184, 181, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#A0B8B5',
                        boxShadow: '0 0 0 3px rgba(160, 184, 181, 0.1)'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(160, 184, 181, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(160, 184, 181, 0.08)'
                }
            }
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    background: 'rgba(160, 184, 181, 0.05)',
                    '& .MuiTableCell-head': {
                        fontWeight: 600,
                        color: '#4A5568',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }
                }
            }
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        background: 'rgba(160, 184, 181, 0.03)'
                    }
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        background: 'rgba(160, 184, 181, 0.1)',
                        transform: 'scale(1.05)'
                    }
                }
            }
        }
    }
});

export default theme;