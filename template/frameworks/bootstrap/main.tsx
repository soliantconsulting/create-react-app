import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './main.scss';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Root element missing');
}

const root = createRoot(container);
root.render((
    <StrictMode>
        <App/>
    </StrictMode>
));
