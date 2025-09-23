import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuItemCard } from '../../../src/components/menu/MenuItemCard';
import { MenuItem, MenuCategory } from '../../../src/types/database';

// Mock menu item data
const mockMenuItem: MenuItem & { menu_categories?: MenuCategory } = {
  id: '1',
  category_id: 'cat1',
  sku: 'SKU001',
  name: 'California Roll',
  description: 'Fresh crab, avocado, and cucumber',
  base_price: 12.99,
  glass_price: null,
  bottle_price: null,
  lunch_price: 10.99,
  dinner_price: 12.99,
  cost: 8.50,
  tax_exempt: false,
  preparation_time: 15,
  calories: 250,
  spicy_level: 0,
  is_raw: false,
  is_vegetarian: true,
  is_gluten_free: true,
  allergens: ['sesame'],
  image_url: null,
  display_order: 1,
  is_available: true,
  is_featured: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  menu_categories: {
    id: 'cat1',
    name: 'Sushi Rolls',
    category_type: 'sushi_rolls',
    display_order: 1,
    icon: null,
    color: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  }
};

describe('MenuItemCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnToggleAvailability = jest.fn();
  const mockOnAddToOrder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders menu item information correctly', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    expect(screen.getByText('California Roll')).toBeInTheDocument();
    expect(screen.getByText('Sushi Rolls')).toBeInTheDocument();
    expect(screen.getByText('$10.99 / $12.99')).toBeInTheDocument();
    expect(screen.getByText('Fresh crab, avocado, and cucumber')).toBeInTheDocument();
  });

  it('displays dietary flags correctly', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    expect(screen.getByText('V GF')).toBeInTheDocument();
    expect(screen.getByText('Contains: sesame')).toBeInTheDocument();
  });

  it('shows add to order button when showOrderButton is true', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    const addButton = screen.getByText('Add to Order');
    expect(addButton).toBeInTheDocument();
  });

  it('calls onAddToOrder when add to order button is clicked', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    fireEvent.click(screen.getByText('Add to Order'));
    expect(mockOnAddToOrder).toHaveBeenCalledWith(mockMenuItem);
  });

  it('shows admin controls when showAdminControls is true', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={true}
        showOrderButton={false}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={true}
        showOrderButton={false}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockMenuItem);
  });

  it('calls onToggleAvailability when hide/show button is clicked', () => {
    render(
      <MenuItemCard
        item={mockMenuItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={true}
        showOrderButton={false}
      />
    );

    fireEvent.click(screen.getByText('Hide'));
    expect(mockOnToggleAvailability).toHaveBeenCalledWith('1', false);
  });

  it('shows unavailable status when item is not available', () => {
    const unavailableItem = { ...mockMenuItem, is_available: false };
    
    render(
      <MenuItemCard
        item={unavailableItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Add to Order')).toBeDisabled();
  });

  it('displays glass/bottle pricing correctly for beverages', () => {
    const beverageItem = {
      ...mockMenuItem,
      name: 'Shiraz Wine',
      glass_price: 10.00,
      bottle_price: 30.00,
      base_price: 30.00
    };

    render(
      <MenuItemCard
        item={beverageItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    expect(screen.getByText('$10.00 / $30.00')).toBeInTheDocument();
  });

  it('displays spicy level correctly', () => {
    const spicyItem = { ...mockMenuItem, spicy_level: 3 };
    
    render(
      <MenuItemCard
        item={spicyItem}
        onEdit={mockOnEdit}
        onToggleAvailability={mockOnToggleAvailability}
        onAddToOrder={mockOnAddToOrder}
        showAdminControls={false}
        showOrderButton={true}
      />
    );

    expect(screen.getByText('V GF 🌶️🌶️🌶️')).toBeInTheDocument();
  });
});
