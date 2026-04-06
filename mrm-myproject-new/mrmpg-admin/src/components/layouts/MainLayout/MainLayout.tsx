import layouts from '@layouts/index'
import { Outlet, useLocation } from 'react-router-dom'

const MainLayout = () => {
    const location = useLocation();
    
    // Determine selected tab based on current route and query params
    const getSelectedTab = () => {
        const { pathname, search } = location;
        const params = new URLSearchParams(search);
        
        // For students page, get enrollment type
        if (pathname === '/members') {
            return params.get('enrollment') || 'long_term';
        }
        
        // For reports page, get report type
        if (pathname === '/reports') {
            return params.get('type') || 'weekly';
        }
        
        // For dashboard page, get view type
        if (pathname === '/') {
            return params.get('view') || 'overview';
        }
        
        return null;
    };

    return (
        <>
            <layouts.TopNav selectedTab={getSelectedTab()} />
            <div className='main-layout'>
                <main>
                    <Outlet />
                </main>
            </div>
        </>
    )
}

export default MainLayout
