import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from '../components/FormField';

describe('FormField', () => {
  const baseProps = {
    label: '이름',
    name: 'name',
    value: '',
    onChange: vi.fn(),
  };

  it('renders label and input', () => {
    render(<FormField {...baseProps} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<FormField {...baseProps} required={true} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<FormField {...baseProps} required={false} />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows error message when error prop provided', () => {
    render(<FormField {...baseProps} error="필수 항목입니다" />);

    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders select with options when type="select"', () => {
    const options = [
      { value: 'a', label: '옵션 A' },
      { value: 'b', label: '옵션 B' },
    ];

    render(
      <FormField
        {...baseProps}
        type="select"
        options={options}
        value="a"
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('옵션 A')).toBeInTheDocument();
    expect(screen.getByText('옵션 B')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    render(<FormField {...baseProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalled();
  });
});
