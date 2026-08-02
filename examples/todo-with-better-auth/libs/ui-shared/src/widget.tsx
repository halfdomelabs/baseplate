export interface WidgetProps {
  label: string;
}

export function Widget({ label }: WidgetProps): React.ReactElement {
  return (
    <div className="bg-primary text-[13.375px] text-primary-foreground">
      {label}
    </div>
  );
}
