interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const baseInputClass = `w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 text-sm transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
    error
      ? 'border-red-300 dark:border-red-500 focus:ring-red-400 focus:border-red-400'
      : 'border-gray-300 dark:border-gray-600 focus:ring-teal-400 focus:border-teal-400'
  }`;

  const ariaProps = {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': required || undefined,
  };

  const renderInput = () => {
    // Select
    if (type === 'select' && options) {
      return (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} bg-white dark:bg-gray-800`}
          required={required}
          {...ariaProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Textarea
    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} resize-y min-h-[80px]`}
          placeholder={placeholder}
          required={required}
          rows={3}
          {...ariaProps}
        />
      );
    }

    // Default input
    return (
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
        placeholder={placeholder}
        required={required}
        {...ariaProps}
      />
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
