# Create Baseplate Project

The Create Baseplate package provides a straightforward method for initiating a new Baseplate project, automatically generating all necessary files within your project directory. Baseplate is a full-stack application generator, laying the groundwork for scalable and maintainable development.

## Private Beta Notice

**Important**: The Baseplate project is currently undergoing a private beta phase and is not yet available to the public. Access is available to authorized beta testers and internal team members. If you're interested in participating in the beta program, please reach out to us at [Half Dome Labs](https://halfdomelabs.com/contact) for more details.

## Creating a Project

To start a new Baseplate project, execute the following command in your terminal:

```bash
pnpm dlx @halfdomelabs/create-project [directory]
```

This command will set up a new Baseplate project in the specified directory. If no directory name is provided, the project will be established in the current directory. After the project setup is complete, navigate to the project directory to begin development on your new Baseplate application using `pnpm baseplate serve`.

## Development

To run the project in development mode, execute the following command in your terminal:

```bash
pnpm dev:start [directory]
```

Note: The `directory` argument is optional and will default to the current directory if not provided.

You should use a directory outside the Baseplate folder to run the full install process otherwise it will create the directory within the create-project directory, e.g.

```bash
pnpm dev:start ~/projects/test-app
```
