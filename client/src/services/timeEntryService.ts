import { TimeEntryFormData } from '@/components/TimeTracking';

const API_BASE_URL = '/api/time-entries';

export interface TimeEntry {
  id: number;
  businessId: number;
  employeeId: number;
  projectId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  laborType: string;
  isOvertime: boolean;
  regularHours: number;
  overtimeHours: number;
  createdAt: string;
  updatedAt: string;
}

export const timeEntryService = {
  async createTimeEntry(entryData: Omit<TimeEntryFormData, 'date'> & { 
    businessId: number; 
    employeeId: number;
    date: string;
  }): Promise<TimeEntry> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(entryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create time entry');
    }

    return response.json();
  },

  async getTimeEntries(params: {
    employeeId: number;
    businessId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntry[]> {
    const { employeeId, businessId, startDate, endDate } = params;
    const url = new URL(API_BASE_URL, window.location.origin);
    
    url.searchParams.append('employeeId', employeeId.toString());
    url.searchParams.append('businessId', businessId.toString());
    
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);

    const response = await fetch(url.toString(), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch time entries');
    }

    return response.json();
  },

  async updateTimeEntry(
    id: number,
    updateData: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TimeEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update time entry');
    }

    return response.json();
  },

  async deleteTimeEntry(id: number, businessId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}?businessId=${businessId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete time entry');
    }
  },

  calculateHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // Handle overnight shifts
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  },

  calculateRegularAndOvertimeHours(totalHours: number, isOvertime: boolean) {
    if (isOvertime) {
      return {
        regularHours: 0,
        overtimeHours: totalHours
      };
    }

    return {
      regularHours: Math.min(8, totalHours),
      overtimeHours: Math.max(0, totalHours - 8)
    };
  }
};
