export interface WidgetProps {
  label: string;
}

export function Widget({ label }: WidgetProps): React.ReactElement {
  return <div>{label}</div>;
}
