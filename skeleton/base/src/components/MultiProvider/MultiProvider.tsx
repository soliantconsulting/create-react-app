import type { ReactNode } from "react";

type ProviderCreator = (children: ReactNode) => ReactNode;

type Props = {
    providerCreators: ProviderCreator[];
    children: ReactNode;
};

const MultiProvider = (props: Props): ReactNode => {
    let root = props.children;

    for (const creator of props.providerCreators.reverse()) {
        root = creator(root);
    }

    return root;
};

export default MultiProvider;
