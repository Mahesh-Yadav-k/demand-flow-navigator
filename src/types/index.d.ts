
// Add or update this to your types/index.d.ts file

export type ActionMenuItem<T> = {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  showIf?: (item: T) => boolean;
};
