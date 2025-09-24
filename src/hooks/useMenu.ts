// React hooks for menu management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService } from '../lib/services/menu.service';
import type { ItemCategory, MenuItemInsert } from '../types/database';

const menuService = new MenuService();

// Hook to get all menu items (alias for useMenuItems)
export function useMenu(categoryType?: ItemCategory) {
  return useMenuItems(categoryType);
}

// Hook to get all menu items
export function useMenuItems(categoryType?: ItemCategory) {
  return useQuery({
    queryKey: ['menuItems', categoryType],
    queryFn: async () => {
      const { data, error } = await menuService.getMenuItems(categoryType);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to get menu categories
export function useMenuCategories() {
  return useQuery({
    queryKey: ['menuCategories'],
    queryFn: async () => {
      const { data, error } = await menuService.getCategories();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Categories change less frequently
  });
}

// Hook to toggle item availability
export function useToggleItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const { data, error } = await menuService.toggleItemAvailability(itemId, isAvailable);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

// Hook to search menu items
export function useSearchMenuItems(searchTerm: string) {
  return useQuery({
    queryKey: ['searchMenuItems', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await menuService.searchItems(searchTerm);
      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm.trim(),
    staleTime: 2 * 60 * 1000, // Search results change frequently
  });
}

// Hook to get featured items
export function useFeaturedItems() {
  return useQuery({
    queryKey: ['featuredItems'],
    queryFn: async () => {
      const { data, error } = await menuService.getFeaturedItems();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Hook to get items by dietary restrictions
export function useItemsByDietaryRestrictions(restrictions: {
  vegetarian?: boolean;
  gluten_free?: boolean;
  no_raw?: boolean;
}) {
  return useQuery({
    queryKey: ['itemsByDietaryRestrictions', restrictions],
    queryFn: async () => {
      const { data, error } = await menuService.getItemsByDietaryRestrictions(restrictions);
      if (error) throw error;
      return data;
    },
    enabled: Object.values(restrictions).some(Boolean),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to add new menu item
export function useAddMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: MenuItemInsert & { modifiers?: string[] }) => {
      const { data, error } = await menuService.addMenuItem(item);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
    },
  });
}

// Hook to update menu item
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Partial<MenuItemInsert>;
    }) => {
      const { data, error } = await menuService.updateMenuItem(itemId, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

// Hook to delete menu item
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await menuService.deleteMenuItem(itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
  });
}

// Hook to get modifiers for an item
export function useItemModifiers(itemId: string) {
  return useQuery({
    queryKey: ['itemModifiers', itemId],
    queryFn: async () => {
      const { data, error } = await menuService.getItemModifiers(itemId);
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to get all modifiers grouped by category
export function useModifiers() {
  return useQuery({
    queryKey: ['modifiers'],
    queryFn: async () => {
      const { data, error } = await menuService.getModifiers();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Hook to create new modifier
export function useCreateModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modifier: { name: string; price: number; modifier_group: string }) => {
      const { data, error } = await menuService.createModifier(modifier);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    },
  });
}

// Hook to add modifier to item
export function useAddModifierToItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      modifierId,
      options,
    }: {
      itemId: string;
      modifierId: string;
      options?: { is_required?: boolean; is_default?: boolean };
    }) => {
      const { data, error } = await menuService.addModifierToItem(itemId, modifierId, options);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['itemModifiers', itemId] });
    },
  });
}

// Hook to remove modifier from item
export function useRemoveModifierFromItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, modifierId }: { itemId: string; modifierId: string }) => {
      const { error } = await menuService.removeModifierFromItem(itemId, modifierId);
      if (error) throw error;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['itemModifiers', itemId] });
    },
  });
}
