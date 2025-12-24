import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid');
  });

  it('should handle empty strings', () => {
    expect(cn('base', '', 'valid')).toBe('base valid');
  });

  it('should handle falsy values', () => {
    expect(cn('base', false, 0, '', undefined, null, 'valid')).toBe('base valid');
  });

  it('should handle object syntax for conditional classes', () => {
    const state = { active: true, disabled: false, loading: true };

    expect(cn('base', {
      'text-green-500': state.active,
      'text-red-500': state.disabled,
      'opacity-50': state.loading,
    })).toBe('base text-green-500 opacity-50');
  });

  it('should handle array of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle nested arrays', () => {
    expect(cn(['class1', ['class2', 'class3']], 'class4')).toBe('class1 class2 class3 class4');
  });

  it('should merge Tailwind classes correctly', () => {
    // Tailwind merge should handle conflicting classes
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle responsive classes', () => {
    expect(cn('sm:text-sm md:text-base', 'lg:text-lg')).toBe('sm:text-sm md:text-base lg:text-lg');
  });

  it('should handle single class', () => {
    expect(cn('single-class')).toBe('single-class');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle complex combinations', () => {
    const baseClasses = 'flex items-center';
    const conditionalClasses = {
      'justify-center': true,
      'justify-between': false,
    };
    const responsiveClasses = 'sm:flex-col md:flex-row';
    const stateClasses = ['bg-blue-500', 'text-white'];

    const result = cn(
      baseClasses,
      conditionalClasses,
      responsiveClasses,
      stateClasses
    );

    expect(result).toBe('flex items-center justify-center sm:flex-col md:flex-row bg-blue-500 text-white');
  });

  it('should handle Tailwind class conflicts resolution', () => {
    // Test that conflicting Tailwind classes are resolved correctly
    expect(cn('text-sm text-lg')).toBe('text-lg');
    expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-2 p-4 p-8')).toBe('p-8');
  });

  it('should handle arbitrary values', () => {
    expect(cn('bg-[#ff0000]', 'bg-[#00ff00]')).toBe('bg-[#00ff00]');
  });

  it('should handle modifiers', () => {
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
  });

  it('should handle important modifier', () => {
    expect(cn('text-red-500', 'text-blue-500!')).toBe('text-blue-500!');
  });

  it('should handle stacked modifiers', () => {
    expect(cn('sm:hover:bg-red-500', 'md:focus:bg-blue-500')).toBe('sm:hover:bg-red-500 md:focus:bg-blue-500');
  });

  it('should preserve non-Tailwind classes', () => {
    expect(cn('custom-class', 'another-custom')).toBe('custom-class another-custom');
  });

  it('should handle mixed Tailwind and non-Tailwind classes', () => {
    expect(cn('flex', 'custom-component', 'bg-blue-500')).toBe('flex custom-component bg-blue-500');
  });
});


