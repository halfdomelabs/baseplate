import { ThemeConfig, themeSchema } from "@halfdomelabs/project-builder-lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProjectConfig } from "src/hooks/useProjectConfig";
import { useResettableForm } from "src/hooks/useResettableForm";
import { useToast } from "src/hooks/useToast";
import { logAndFormatError } from "src/services/error-formatter";

export function ThemeHomePage(): JSX.Element {
  const {config, parsedProject,setConfigAndFixReferences}= useProjectConfig();
  const toast = useToast();

  const {control,reset,handleSubmit  } = useResettableForm<ThemeConfig>({
    resolver: zodResolver(themeSchema),
    defaultValues: config.theme,
  })
  const onSubmit = (data: ThemeConfig): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.theme = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  };

  return <div className="space-y-4">
    <h1>Theme Picker</h1>
    <p>Pick a base color</p>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" />
  </div>
}