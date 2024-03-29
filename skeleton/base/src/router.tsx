import Layout from "@/components/Layout/index.ts";
import RootErrorBoundary from "@/components/RootErrorBoundary/index.ts";
import HomePage from "@/pages/HomePage/index.ts";
import { Outlet, type RouteObject, createBrowserRouter } from "react-router-dom";

const pathRoutes: RouteObject[] = [
    {
        path: "/",
        element: <HomePage />,
    },
];

const rootRoute: RouteObject = {
    path: "/",
    element: <Layout />,
    children: [
        {
            path: "",
            element: <Outlet />,
            errorElement: <RootErrorBoundary />,
            children: pathRoutes,
        },
    ],
};

export const router = createBrowserRouter([rootRoute]);

if (import.meta.hot) {
    import.meta.hot.dispose(() => router.dispose());
}
