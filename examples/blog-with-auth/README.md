# Baseplate Project

Welcome to your new Baseplate project! This README provides essential information on how to get started with your project, including setting up the generator UI and beginning your development process.

## Getting Started

To begin using the project, you will need to set up your local environment. Follow these instructions to get everything up and running.

### Prerequisites

Before you start, ensure you have `pnpm` installed on your system. If you do not have `pnpm` installed, you can learn how to install it by visiting [pnpm installation guide](https://pnpm.io/installation).

### Environment Setup

For this project, you will need to set up environment variables that the application requires to function properly. One essential variable is `NPM_TOKEN`, which is used for accessing private npm packages. If you set this project up with the project creator, you should have already been asked for this token. Otherwise, to set this up:

1. Create a `.env` file in the root directory of your project.
2. Add the following line to the `.env` file:

```bash
NPM_TOKEN=<your-npm-token>
```

You can obtain the NPM token from your engineering manager.

### Installation

To install the necessary dependencies for your project, run the following command in the root directory of your project:

```bash
pnpm install
```

### Launching the Generator UI

To start the generator UI, which allows you to configure and initiate the code generation process, execute the following command:

```bash
pnpm baseplate serve
```

This command will start the server and open the corresponding web interface where you can customize your project’s specifications and features and generate the code.

## Configuration

To configure your project settings, use the web interface launched by the above command. Here you can specify data models, authentication mechanisms, and other project-specific settings.

Thank you for choosing Baseplate for your project’s foundation!
