import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

describe('UI Components', () => {
  describe('Button', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should apply variant classes', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('primary');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toBeDisabled();
    });

    it('should handle click events', () => {
      let clicked = false;
      render(<Button onClick={() => (clicked = true)}>Click</Button>);
      
      screen.getByText('Click').click();
      expect(clicked).toBe(true);
    });

    it('should render different sizes', () => {
      const { container: small } = render(<Button size="sm">Small</Button>);
      const { container: large } = render(<Button size="lg">Large</Button>);

      expect(small.querySelector('button')).toHaveClass('sm');
      expect(large.querySelector('button')).toHaveClass('lg');
    });
  });

  describe('Card', () => {
    it('should render card with content', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render card header', () => {
      render(
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>Body</Card.Body>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Input', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle value changes', () => {
      let value = '';
      render(
        <Input
          value={value}
          onChange={(e) => (value = e.target.value)}
          placeholder="Type here"
        />
      );

      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      input.value = 'new value';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(value).toBe('new value');
    });

    it('should show error state', () => {
      const { container } = render(<Input error="Error message" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(container.querySelector('input')).toHaveClass('error');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled placeholder="Disabled" />);
      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('should render different input types', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });
  });
});
