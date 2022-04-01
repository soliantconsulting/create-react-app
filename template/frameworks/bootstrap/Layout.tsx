import {Outlet} from 'react-router-dom';

const Layout = () : JSX.Element => {
    return (
        <>
            <header>
                <h1>Layout</h1>
            </header>
            <main>
                <Outlet/>
            </main>
        </>
    );
};

export default Layout;
