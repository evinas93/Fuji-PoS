// Menu management service for Fuji POS System
import { supabase } from '../supabase';
import type { MenuItem, MenuItemInsert, MenuCategory, Modifier, ItemCategory } from '../../types/database';

export class MenuService {
  // Get all menu items with categories and modifiers
  async getMenuItems(categoryType?: ItemCategory) {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          category_type,
          color,
          icon
        ),
        item_modifiers (
          is_required,
          is_default,
          modifiers (
            id,
            name,
            price,
            modifier_group
          )
        )
      `)
      .eq('is_available', true)
      .order('display_order');

    if (categoryType) {
      query = query.eq('menu_categories.category_type', categoryType);
    }

    const { data, error } = await query;
    return { data, error };
  }

  // Get menu items by category
  async getMenuItemsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        item_modifiers (
          is_required,
          is_default,
          modifiers (
            id,
            name,
            price,
            modifier_group
          )
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order');

    return { data, error };
  }

  // Search menu items using database function
  async searchItems(searchTerm: string) {
    const { data, error } = await supabase
      .rpc('search_menu_items', { search_term: searchTerm });

    return { data, error };
  }

  // Get all categories
  async getCategories() {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    return { data, error };
  }

  // Update item availability (for servers and managers)
  async toggleItemAvailability(itemId: string, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ 
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    return { data, error };
  }

  // Add new menu item (manager/admin only)
  async addMenuItem(item: MenuItemInsert & {
    modifiers?: string[];
  }) {
    const { modifiers, ...menuItemData } = item;

    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .insert(menuItemData)
      .select()
      .single();

    if (menuError) return { data: null, error: menuError };

    // Link modifiers if provided
    if (modifiers?.length) {
      const modifierLinks = modifiers.map(modifierId => ({
        item_id: menuItem.id,
        modifier_id: modifierId,
        is_required: false,
        is_default: false
      }));

      const { error: modifierError } = await supabase
        .from('item_modifiers')
        .insert(modifierLinks);

      if (modifierError) {
        console.warn('Failed to link modifiers:', modifierError);
      }
    }

    return { data: menuItem, error: null };
  }

  // Update menu item (manager/admin only)
  async updateMenuItem(itemId: string, updates: Partial<MenuItemInsert>) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    return { data, error };
  }

  // Delete menu item (manager/admin only)
  async deleteMenuItem(itemId: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    return { error };
  }

  // Get item pricing based on context (lunch/dinner, glass/bottle)
  getItemPrice(item: MenuItem, context: {
    time_period?: 'lunch' | 'dinner';
    serving_type?: 'glass' | 'bottle';
  } = {}) {
    // For beverages with glass/bottle pricing
    if (item.glass_price && item.bottle_price) {
      return context.serving_type === 'bottle' ? item.bottle_price : item.glass_price;
    }

    // For items with lunch/dinner pricing
    if (item.lunch_price && item.dinner_price) {
      const currentHour = new Date().getHours();
      const isLunchTime = currentHour >= 11 && currentHour < 16; // 11 AM to 4 PM
      
      if (context.time_period) {
        return context.time_period === 'lunch' ? item.lunch_price : item.dinner_price;
      } else {
        return isLunchTime ? item.lunch_price : item.dinner_price;
      }
    }

    // Default to base price
    return item.base_price;
  }

  // Get featured items
  async getFeaturedItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          name,
          category_type,
          color
        )
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .order('display_order');

    return { data, error };
  }

  // Get items by dietary restrictions
  async getItemsByDietaryRestrictions(restrictions: {
    vegetarian?: boolean;
    gluten_free?: boolean;
    no_raw?: boolean;
  }) {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          name,
          category_type
        )
      `)
      .eq('is_available', true);

    if (restrictions.vegetarian) {
      query = query.eq('is_vegetarian', true);
    }

    if (restrictions.gluten_free) {
      query = query.eq('is_gluten_free', true);
    }

    if (restrictions.no_raw) {
      query = query.eq('is_raw', false);
    }

    const { data, error } = await query.order('name');
    return { data, error };
  }

  // Get modifiers for an item
  async getItemModifiers(itemId: string) {
    const { data, error } = await supabase
      .from('item_modifiers')
      .select(`
        is_required,
        is_default,
        modifiers (
          id,
          name,
          price,
          modifier_group,
          is_active
        )
      `)
      .eq('item_id', itemId)
      .eq('modifiers.is_active', true)
      .order('modifiers.modifier_group')
      .order('modifiers.name');

    return { data, error };
  }

  // Add modifier to item
  async addModifierToItem(itemId: string, modifierId: string, options: {
    is_required?: boolean;
    is_default?: boolean;
  } = {}) {
    const { data, error } = await supabase
      .from('item_modifiers')
      .insert({
        item_id: itemId,
        modifier_id: modifierId,
        is_required: options.is_required || false,
        is_default: options.is_default || false
      });

    return { data, error };
  }

  // Remove modifier from item
  async removeModifierFromItem(itemId: string, modifierId: string) {
    const { error } = await supabase
      .from('item_modifiers')
      .delete()
      .eq('item_id', itemId)
      .eq('modifier_id', modifierId);

    return { error };
  }

  // Create new modifier
  async createModifier(modifier: {
    name: string;
    price: number;
    modifier_group: string;
  }) {
    const { data, error } = await supabase
      .from('modifiers')
      .insert(modifier)
      .select()
      .single();

    return { data, error };
  }

  // Get all modifiers grouped by category
  async getModifiers() {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .eq('is_active', true)
      .order('modifier_group')
      .order('name');

    if (error) return { data: null, error };

    // Group by modifier_group
    const grouped = data.reduce((acc, modifier) => {
      const group = modifier.modifier_group || 'other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(modifier);
      return acc;
    }, {} as Record<string, typeof data>);

    return { data: grouped, error: null };
  }

  // Calculate item total with modifiers
  calculateItemTotal(item: MenuItem, quantity: number, selectedModifiers: Array<{ id: string; price: number }> = []) {
    const basePrice = this.getItemPrice(item);
    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    return (basePrice + modifierTotal) * quantity;
  }

  // Check item availability and dietary info
  getItemInfo(item: MenuItem) {
    return {
      isAvailable: item.is_available,
      isVegetarian: item.is_vegetarian,
      isGlutenFree: item.is_gluten_free,
      isRaw: item.is_raw,
      spicyLevel: item.spicy_level || 0,
      allergens: item.allergens as string[] || [],
      calories: item.calories,
      preparationTime: item.preparation_time || 15,
      profitMargin: item.cost ? ((item.base_price - item.cost) / item.base_price) * 100 : null
    };
  }
}

