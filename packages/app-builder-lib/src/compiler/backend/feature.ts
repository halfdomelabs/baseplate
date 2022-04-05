import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildModelsForFeature } from './models';
import { buildSchemaTypesForFeature } from './schemaTypes';
import { buildServicesForFeature } from './services';

export function buildFeature(
  featurePath: string,
  builder: ProjectEntryBuilder
): unknown {
  const { appConfig, parsedApp } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    appConfig.features?.filter((f) => f.startsWith(`${featurePath}/`)) || [];

  let authAdditions = {};
  const { auth } = appConfig;

  const isAuthFeature = auth?.featurePath === featurePath;
  if (isAuthFeature) {
    authAdditions = {
      $auth: {
        generator: '@baseplate/fastify/auth/auth-module',
        userModelName: auth.userModel,
        children: {
          roleService: {
            name: 'AuthRoleService',
            generator: '@baseplate/fastify/core/service-file',
            peerProvider: true,
            children: {
              $roles: {
                generator: '@baseplate/fastify/auth/role-service',
                userModelName: auth.userModel,
                userRoleModelName: auth.userRoleModel,
                roles: auth.roles,
              },
            },
          },
        },
      },
      ...(!auth.passwordProvider
        ? {}
        : {
            $passwordAuthService: {
              name: 'PasswordAuthService',
              generator: '@baseplate/fastify/auth/password-auth-service',
              peerProvider: true,
            },
            $passwordAuthMutations: {
              name: 'PasswordAuthMutations',
              generator: '@baseplate/fastify/auth/password-auth-mutations',
            },
          }),
    };
  }

  if (
    parsedApp
      .getModels()
      .some((m) => m.feature === featurePath && m.name === auth?.userModel)
  ) {
    authAdditions = {
      ...authAdditions,
      $hasherService: {
        name: 'HasherService',
        generator: '@baseplate/fastify/auth/password-hasher-service',
      },
    };
  }

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@baseplate/fastify/core/app-module',
    hoistedProviders: isAuthFeature ? ['auth-service', 'auth-mutations'] : [],
    children: {
      $models: buildModelsForFeature(featurePath, parsedApp),
      $services: buildServicesForFeature(featurePath, parsedApp),
      $schemaTypes: buildSchemaTypesForFeature(featurePath, parsedApp),
      $submodules: subFeatures.map((subFeature) =>
        buildFeature(subFeature, builder)
      ),
      ...authAdditions,
    },
  });

  return descriptorLocation;
}
