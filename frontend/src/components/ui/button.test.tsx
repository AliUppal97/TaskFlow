import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'whitespace-nowrap',
      'rounded-md',
      'text-sm',
      'font-medium',
      'ring-offset-background',
      'transition-colors',
      'focus-visible:outline-none',
      'focus-visible:ring-0',
      'focus-visible:ring-offset-0',
      'disabled:pointer-events-none',
      'disabled:opacity-50',
      'border-0',
      'bg-primary',
      'text-primary-foreground',
      'hover:bg-primary/90',
      'h-10',
      'px-4',
      'py-2'
    );
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-0', 'bg-background', 'hover:bg-accent', 'hover:text-accent-foreground');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'rounded-md', 'px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11', 'rounded-md', 'px-8');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('should merge custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-primary'); // Should still have default classes
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle disabled state', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should support asChild prop with Slot', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-primary', 'text-primary-foreground'); // Should have button styles
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Button with ref</Button>);

    expect(ref).toHaveBeenCalled();
    const buttonElement = ref.mock.calls[0][0];
    expect(buttonElement.tagName).toBe('BUTTON');
  });

  it('should pass through other props', () => {
    render(
      <Button type="submit" data-testid="submit-button">
        Submit
      </Button>
    );

    const button = screen.getByTestId('submit-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should handle loading state via disabled prop', () => {
    render(<Button disabled>Loading...</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should have proper focus styles', () => {
    render(<Button>Focusable</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-0', 'focus-visible:ring-offset-0');
  });

  it('should handle keyboard events', async () => {
    const user = userEvent.setup();
    const handleKeyDown = jest.fn();

    render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);

    const button = screen.getByRole('button');
    await user.type(button, '{enter}');

    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('should be accessible with proper role', () => {
    render(<Button>Accessible Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button'); // Default type
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Submit Form</Button>
      </form>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalled();
  });
});

