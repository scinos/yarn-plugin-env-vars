module.exports = {
  name: "yarn-plugin-env-vars",
  factory: () => {
    const loadEnvConfig = (project, directory) => {
      // Find the workspace that contains current route. We need this because
      // it's posible to run scripts form inside a package ('cd src && yarn test'). In this case
      // the package won't be at `$CWD/package.json`, but `../package.json`.

      // First, find all workspaces that contain current dir.
      // Then, as we can have multiple workspaces (eg: `foo/packages/package1/src/` will find `foo/`
      // and `foo/packages/package1`), look for the project with the longest path. This assumes
      // workspaces are always nested. I don't know if that is always true, but I haven't seen the opposite ever.

      const workspace = project.workspaces
        .filter((workspace) => directory.startsWith(workspace.cwd))
        .sort((a, b) => b.cwd.length - a.cwd.length)[0];

      if (!workspace) {
        throw new Error(`Can't locate workspace for ${directory}`);
      }

      return workspace.manifest.raw.env;
    };

    return {
      hooks: {
        setupScriptEnvironment: async (project, env) => {
          const { projectCwd, startingCwd } = project.configuration;

          const envConfig = {
            ...(startingCwd !== projectCwd
              ? loadEnvConfig(project, projectCwd) || {}
              : {}),
            ...(loadEnvConfig(project, startingCwd) || {}),
          };
          for (const [name, value] of Object.entries(envConfig)) {
            // If value is null, unset it
            if (value === null) {
              delete env[name];
              continue;
            }

            // If env is not present, create it
            if (!(name in env)) {
              env[name] = value;
            }
          }
        },
      },
    };
  },
};
