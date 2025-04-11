
// Making sure this type definition is in the .d.ts file too for consistency

export type ActionMenuItem<T> = {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  showIf?: (item: T) => boolean;
};

