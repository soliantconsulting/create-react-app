import type { Plugin } from "vite";

type Warning = {
    code: string;
    message: string;
};

// @see https://github.com/vitejs/vite/issues/15012#issuecomment-1825035992
export const muteWarningsPlugin = (warningsToIgnore: Warning[]): Plugin => {
    const mutedMessages = new Set();

    return {
        name: "mute-warnings",
        enforce: "pre",
        config: (userConfig) => ({
            build: {
                rollupOptions: {
                    onwarn(warning, defaultHandler) {
                        if (warning.code) {
                            const muted = warningsToIgnore.find(
                                ({ code, message }) =>
                                    code === warning.code && warning.message.includes(message),
                            );

                            if (muted) {
                                mutedMessages.add(muted);
                                return;
                            }
                        }

                        if (userConfig.build?.rollupOptions?.onwarn) {
                            userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
                        } else {
                            defaultHandler(warning);
                        }
                    },
                },
            },
        }),
        closeBundle() {
            const diff = warningsToIgnore.filter((warning) => !mutedMessages.has(warning));

            if (diff.length > 0) {
                this.warn("Some of your muted warnings never appeared during the build process:");

                for (const warning of diff) {
                    this.warn(`- ${warning.code}: ${warning.message}`);
                }
            }
        },
    };
};
