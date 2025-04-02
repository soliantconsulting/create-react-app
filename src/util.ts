import { type Options, type Result, execa } from "execa";

export type ExecuteResult = Result<{ encoding: "utf8" }>;

export const execute = async (
    stdout: NodeJS.WritableStream,
    file: string,
    args: readonly string[],
    options?: Options,
): Promise<ExecuteResult> => {
    const execute = execa(file, args, {
        ...options,
        encoding: "utf8",
    });

    execute.stdout?.pipe(stdout);
    execute.stderr?.pipe(stdout);

    return (await execute) as ExecuteResult;
};
