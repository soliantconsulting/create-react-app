import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {createTheme, CssBaseline} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {StrictMode} from 'react';
import {render} from 'react-dom';
import App from './App';

const theme = createTheme();

render(
    (
        <StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <App/>
            </ThemeProvider>
        </StrictMode>
    ),
    document.getElementById('root')
);
