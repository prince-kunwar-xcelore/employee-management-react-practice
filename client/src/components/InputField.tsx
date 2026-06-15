import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type InputProps = {
  id: string;
  type?: string;
  placeholder?: string;
  label?: string;
  description?: string;
  value?: string;
  setValue?: (value: string) => void;
};

export function InputField({
  id,
  type = 'text',
  label,
  placeholder,
  description,
  value = '',
  setValue = () => {},
}: InputProps) {
  return (
    <Field>
      {label && <FieldLabel htmlFor={`input-field-${id}`}> {label}</FieldLabel>}
      <Input
        id={`input-field-${id}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
