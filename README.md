# Create React App

This is an init project for creating React app projects with an optional CDK deployment pipeline.

To create a new project, run the following command:

```npm init @soliantconsulting/react-app```

The init script will ask a few questions:

- `App name`: will be used as the package name as well as name of the deployment pipeline. Should be something like
  `my-foo-api`.
- `Description`: will be used as the package description as well as the title for the `README.md`.
- `Use CDK`: toggles whether the project should be initialized with a CDK pipeline.

The script will place the project in a directory with the given app name under the current working directory.

After initialization, check the output and the generated `README.md` for further instructions.
