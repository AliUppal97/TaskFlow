import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-sm',
      'ring-offset-background',
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'transition-all',
      'duration-200'
    );
  });

  it('should accept different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('should accept placeholder text', () => {
    render(<Input placeholder="Enter your name" />);

    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('should accept initial value', () => {
    render(<Input defaultValue="Initial value" />);

    const input = screen.getByDisplayValue('Initial value');
    expect(input).toBeInTheDocument();
  });

  it('should handle controlled input', () => {
    const handleChange = jest.fn();
    render(<Input value="Controlled value" onChange={handleChange} />);

    const input = screen.getByDisplayValue('Controlled value');
    expect(input).toBeInTheDocument();
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello World');

    expect(handleChange).toHaveBeenCalledTimes(11); // 11 characters including spaces
    expect(input).toHaveValue('Hello World');
  });

  it('should handle disabled state', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('should merge custom className', () => {
    render(<Input className="custom-input" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
    expect(input).toHaveClass('border-input'); // Should still have default classes
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalled();
    const inputElement = ref.mock.calls[0][0];
    expect(inputElement.tagName).toBe('INPUT');
  });

  it('should pass through other props', () => {
    render(<Input data-testid="custom-input" maxLength={10} />);

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('should handle focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');

    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab(); // Move focus away
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should show focus ring on focus', async () => {
    const user = userEvent.setup();

    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring');

    await user.click(input);
    // Focus ring classes should be present
    expect(input).toHaveClass('focus-visible:ring-2');
  });

  it('should handle required attribute', () => {
    render(<Input required />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('should handle readOnly attribute', () => {
    render(<Input readOnly defaultValue="Read only text" />);

    const input = screen.getByDisplayValue('Read only text');
    expect(input).toHaveAttribute('readOnly');
  });

  it('should handle file input styling', () => {
    render(<Input type="file" />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveClass('file:border-0', 'file:bg-transparent', 'file:text-sm', 'file:font-medium');
  });

  it('should handle form integration', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <Input name="username" />
        <button type="submit">Submit</button>
      </form>
    );

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    await user.type(input, 'testuser');
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
    expect(input).toHaveValue('testuser');
  });

  it('should handle keyboard events', async () => {
    const user = userEvent.setup();
    const handleKeyDown = jest.fn();

    render(<Input onKeyDown={handleKeyDown} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(<Input aria-label="Username" />);

    const input = screen.getByLabelText('Username');
    expect(input).toBeInTheDocument();
  });

  it('should handle autoComplete attribute', () => {
    render(<Input autoComplete="username" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autoComplete', 'username');
  });
});

