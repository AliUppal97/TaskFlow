import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default styling', () => {
      render(<Card>Card content</Card>);

      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('should merge custom className', () => {
      render(<Card className="custom-card">Card content</Card>);

      const card = screen.getByText('Card content');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('rounded-lg'); // Should still have default classes
    });

    it('should forward ref correctly', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Card content</Card>);

      expect(ref).toHaveBeenCalled();
      const cardElement = ref.mock.calls[0][0];
      expect(cardElement.tagName).toBe('DIV');
    });

    it('should pass through other props', () => {
      render(<Card data-testid="custom-card">Card content</Card>);

      const card = screen.getByTestId('custom-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render with default styling', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );

      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should merge custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Header content</CardHeader>
        </Card>
      );

      const header = screen.getByText('Header content');
      expect(header).toHaveClass('custom-header', 'flex', 'flex-col');
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 with default styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });

    it('should merge custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Card Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('custom-title', 'text-2xl');
    });
  });

  describe('CardDescription', () => {
    it('should render with default styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
        </Card>
      );

      const description = screen.getByText('Card description text');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-description">
              Card description
            </CardDescription>
          </CardHeader>
        </Card>
      );

      const description = screen.getByText('Card description');
      expect(description).toHaveClass('custom-description', 'text-sm');
    });
  });

  describe('CardContent', () => {
    it('should render with default styling', () => {
      render(
        <Card>
          <CardContent>Card content area</CardContent>
        </Card>
      );

      const content = screen.getByText('Card content area');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content">Card content</CardContent>
        </Card>
      );

      const content = screen.getByText('Card content');
      expect(content).toHaveClass('custom-content', 'p-6');
    });
  });

  describe('CardFooter', () => {
    it('should render with default styling', () => {
      render(
        <Card>
          <CardFooter>Card footer content</CardFooter>
        </Card>
      );

      const footer = screen.getByText('Card footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Card footer</CardFooter>
        </Card>
      );

      const footer = screen.getByText('Card footer');
      expect(footer).toHaveClass('custom-footer', 'flex', 'items-center');
    });
  });

  describe('Complete Card composition', () => {
    it('should render a complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>
              Manage your tasks efficiently with our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      // Check all parts are present
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Task Management');
      expect(screen.getByText('Manage your tasks efficiently with our platform')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action Button');
    });

    it('should handle empty card sections gracefully', () => {
      render(
        <Card>
          <CardHeader />
          <CardContent />
          <CardFooter />
        </Card>
      );

      // Should render without crashing
      const card = screen.getByRole('generic'); // div element
      expect(card).toBeInTheDocument();
      expect(card.children).toHaveLength(3); // header, content, footer
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('should support custom heading levels', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h1>Custom H1 Title</h1>
            </CardTitle>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Custom H1 Title');
    });
  });

  describe('Ref forwarding', () => {
    it('should forward refs to all card components', () => {
      const cardRef = jest.fn();
      const headerRef = jest.fn();
      const titleRef = jest.fn();
      const descriptionRef = jest.fn();
      const contentRef = jest.fn();
      const footerRef = jest.fn();

      render(
        <Card ref={cardRef}>
          <CardHeader ref={headerRef}>
            <CardTitle ref={titleRef}>Title</CardTitle>
            <CardDescription ref={descriptionRef}>Description</CardDescription>
          </CardHeader>
          <CardContent ref={contentRef}>Content</CardContent>
          <CardFooter ref={footerRef}>Footer</CardFooter>
        </Card>
      );

      expect(cardRef).toHaveBeenCalled();
      expect(headerRef).toHaveBeenCalled();
      expect(titleRef).toHaveBeenCalled();
      expect(descriptionRef).toHaveBeenCalled();
      expect(contentRef).toHaveBeenCalled();
      expect(footerRef).toHaveBeenCalled();
    });
  });
});
