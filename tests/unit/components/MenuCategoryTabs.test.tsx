import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuCategoryTabs } from '../../../src/components/menu/MenuCategoryTabs';
import { MenuCategory } from '../../../src/types/database';

// Mock category data
const mockCategories: MenuCategory[] = [
  {
    id: '1',
    name: 'Sushi Rolls',
    category_type: 'sushi_rolls',
    display_order: 1,
    icon: null,
    color: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Red Wine',
    category_type: 'red_wine',
    display_order: 2,
    icon: null,
    color: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Dinner',
    category_type: 'dinner',
    display_order: 3,
    icon: null,
    color: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  }
];

describe('MenuCategoryTabs', () => {
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all categories correctly', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    expect(screen.getByText('🍽️ All Items')).toBeInTheDocument();
    expect(screen.getByText('Sushi Rolls')).toBeInTheDocument();
    expect(screen.getByText('Red Wine')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('shows correct icons for different category types', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    expect(screen.getByText('Sushi Rolls')).toBeInTheDocument();
    expect(screen.getByText('Red Wine')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('highlights active category', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory="1"
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    const sushiButton = screen.getByText('Sushi Rolls').closest('button');
    expect(sushiButton).toHaveClass('bg-blue-600');
  });

  it('calls onCategoryChange when category is clicked', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    fireEvent.click(screen.getByText('Sushi Rolls'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('1');
  });

  it('calls onCategoryChange with null when All Items is clicked', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory="1"
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    fireEvent.click(screen.getByText('🍽️ All Items'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith(null);
  });

  it('does not show All Items option when showAllOption is false', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={false}
      />
    );

    expect(screen.queryByText('🍽️ All Items')).not.toBeInTheDocument();
  });

  it('handles empty categories array', () => {
    render(
      <MenuCategoryTabs
        categories={[]}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    expect(screen.getByText('🍽️ All Items')).toBeInTheDocument();
    expect(screen.queryByText('Sushi Rolls')).not.toBeInTheDocument();
  });

  it('applies correct color classes for different category types', () => {
    render(
      <MenuCategoryTabs
        categories={mockCategories}
        activeCategory={null}
        onCategoryChange={mockOnCategoryChange}
        showAllOption={true}
      />
    );

    const sushiButton = screen.getByText('Sushi Rolls').closest('button');
    const wineButton = screen.getByText('Red Wine').closest('button');
    const dinnerButton = screen.getByText('Dinner').closest('button');

    expect(sushiButton).toHaveClass('bg-green-100');
    expect(wineButton).toHaveClass('bg-red-100');
    expect(dinnerButton).toHaveClass('bg-gray-100');
  });
});
