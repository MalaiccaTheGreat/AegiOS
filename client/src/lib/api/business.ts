import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Business } from '@shared/schema';

const API_BASE_URL = '/api/businesses';

export const useBusinesses = () => {
  return useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      return response.json();
    },
  });
};

export const useBusiness = (id: number) => {
  return useQuery<Business>({
    queryKey: ['business', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch business');
      }
      return response.json();
    },
  });
};

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create business');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the businesses list
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
};

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Business> & { id: number }) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update business');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch the businesses list and the specific business
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', data.id] });
    },
  });
};

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete business');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the businesses list
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
};
