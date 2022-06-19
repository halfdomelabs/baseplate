import { AdminAppConfig, AdminCrudSectionConfig } from '@src/schema';
import { AppEntryBuilder } from '../appEntryBuilder';

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  return {
    name: crudSection.name,
    generator: '@baseplate/react/core/react-routes',
    children: {
      $section: {
        generator: '@baseplate/react/admin/admin-crud-section',
        modelName: crudSection.modelName,
        children: {
          edit: {
            fields: crudSection.form.fields.map((f) => {
              if (f.type === 'text' && !f.validation) {
                return {
                  ...f,
                  validation: builder.parsedProject.getModelFieldValidation(
                    crudSection.modelName,
                    f.modelField,
                    true
                  ),
                };
              }
              return f;
            }),
          },
          list: {
            columns: crudSection.table.columns,
          },
        },
      },
    },
  };
}

export function compileAdminSections(
  featurePath: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown[] | undefined {
  const sections = builder.appConfig.sections?.filter(
    (s) => s.feature === featurePath
  );

  if (!sections?.length) {
    return undefined;
  }

  return sections.map((section) => {
    switch (section.type) {
      case 'crud':
        return compileAdminCrudSection(section, builder);
      default:
        throw new Error(`Unknown section type ${section.type as string}`);
    }
  });
}

function compileAdminFeatureRecursive(
  featurePath: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown | null {
  const { projectConfig, parsedProject } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    projectConfig.features?.filter((f) =>
      f.name.startsWith(`${featurePath}/`)
    ) || [];

  const subDescriptors = subFeatures.flatMap((subFeature) =>
    compileAdminFeatureRecursive(subFeature.name, builder)
  );

  const sectionDescriptors = compileAdminSections(featurePath, builder);

  if (!subDescriptors.length && !sectionDescriptors) {
    return null;
  }

  builder.addDescriptor(`${descriptorLocation}.json`, {
    name: featureName,
    generator: '@baseplate/react/core/react-routes',
    hoistedProviders: parsedProject.getFeatureHoistedProviders(featurePath),
    // add admin layout to any root features
    layoutKey: featurePath.includes('/') ? undefined : 'admin',
    children: {
      $sections: sectionDescriptors,
      $childRoutes: subDescriptors,
    },
  });

  return descriptorLocation;
}

export function compileAdminFeatures(
  builder: AppEntryBuilder<AdminAppConfig>
): unknown[] {
  const { projectConfig } = builder;
  const rootFeatures =
    projectConfig.features?.filter((f) => !f.name.includes('/')) || [];

  return rootFeatures.flatMap((feature) =>
    compileAdminFeatureRecursive(feature.name, builder)
  );
}
