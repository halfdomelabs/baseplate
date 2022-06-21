import {
  AdminAppConfig,
  AdminCrudEnumInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputConfig,
  AdminCrudSectionConfig,
} from '@src/schema';
import { notEmpty } from '@src/utils/array';
import { AppEntryBuilder } from '../appEntryBuilder';

function compileAdminEnumInput(
  field: AdminCrudEnumInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const fieldConfig = model.model.fields.find(
    (f) => f.name === field.modelField
  );
  if (fieldConfig?.type !== 'enum') {
    throw new Error(`Admin enum input ${field.modelField} is not an enum`);
  }
  const enumBlock = builder.parsedProject
    .getEnums()
    .find((e) => e.name === fieldConfig.options?.enumType);
  if (!enumBlock) {
    throw new Error(
      `Could not find enum type ${fieldConfig.options?.enumType || ''}`
    );
  }
  return {
    name: field.modelField,
    generator: '@baseplate/react/admin/admin-crud-enum-input',
    modelField: field.modelField,
    label: field.label,
    isOptional: fieldConfig.isOptional,
    options: enumBlock.values.map((v) => ({
      label: v.friendlyName,
      value: v.name,
    })),
  };
}

function compileAdminForeignInput(
  field: AdminCrudForeignInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const relation = model.model.relations?.find(
    (r) => r.name === field.localRelationName
  );

  if (!relation) {
    throw new Error(
      `Could not find relation ${field.localRelationName} in model ${modelName}`
    );
  }

  if (relation.references.length !== 1) {
    throw new Error(`Only relations with a single reference are supported`);
  }

  const localField = relation.references[0].local;

  return {
    name: field.localRelationName,
    generator: '@baseplate/react/admin/admin-crud-foreign-input',
    label: field.label,
    localRelationName: field.localRelationName,
    isOptional: relation.isOptional,
    localField,
    foreignModelName: relation.modelName,
    labelExpression: field.labelExpression,
    valueExpression: field.valueExpression,
    defaultLabel: field.defaultLabel,
  };
}

function compileAdminCrudInput(
  field: AdminCrudInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  switch (field.type) {
    case 'foreign':
      return compileAdminForeignInput(field, modelName, builder);
    case 'enum':
      return compileAdminEnumInput(field, modelName, builder);
    case 'text':
      return {
        name: field.modelField,
        generator: '@baseplate/react/admin/admin-crud-text-input',
        label: field.label,
        modelField: field.modelField,
        validation:
          field.validation ||
          builder.parsedProject.getModelFieldValidation(
            modelName,
            field.modelField,
            true
          ),
      };
    default:
      throw new Error(
        `Unknown admin crud input ${(field as { type: string }).type}`
      );
  }
}

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
            children: {
              inputs: crudSection.form.fields.map((field) =>
                compileAdminCrudInput(field, crudSection.modelName, builder)
              ),
            },
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
): unknown {
  const { projectConfig, parsedProject } = builder;
  const descriptorLocation = `${featurePath}/root`;
  const featureName = featurePath.split('/').pop();
  // find sub-features
  const subFeatures =
    projectConfig.features?.filter((f) =>
      f.name.startsWith(`${featurePath}/`)
    ) || [];

  const subDescriptors = subFeatures
    .flatMap((subFeature) =>
      compileAdminFeatureRecursive(subFeature.name, builder)
    )
    .filter(notEmpty);

  const sectionDescriptors = compileAdminSections(featurePath, builder);

  if (!subDescriptors.length && !sectionDescriptors) {
    return undefined;
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
