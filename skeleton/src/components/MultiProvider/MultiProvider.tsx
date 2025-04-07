import type { ReactNode } from "react";

type ProviderCreator = (children: ReactNode) => ReactNode;

type Props = {
    providerCreators: ProviderCreator[];
    children: ReactNode;
};

const MultiProvider = ({ providerCreators, children }: Props): ReactNode => {
    let root = children;

    for (const creator of [...providerCreators].reverse()) {
        root = creator(root);
    }

    return root;
};

export default MultiProvider;
