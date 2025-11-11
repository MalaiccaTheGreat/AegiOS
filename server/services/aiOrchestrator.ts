import { db } from '../db';
import { businesses, reports, timeEntries, projects } from '../../shared/schema.js';
import { sql } from 'drizzle-orm';

interface AIInsights {
  businessId: number;
  predictions: {
    revenueForecast: Array<{ date: string; amount: number }>;
    busyPeriods: Array<{ start: string; end: string; intensity: number }>;
  };
  recommendations: string[];
  anomalies: Array<{
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export class AIOrchestrator {
  static async analyzeBusiness(businessId: number): Promise<AIInsights> {
    // Get business data
    const businessData = await db.query.businesses.findFirst({
      where: (businesses, { eq }) => eq(businesses.id, businessId),
      with: {
        reports: true,
        timeEntries: true,
        projects: true
      }
    });

    if (!businessData) {
      throw new Error('Business not found');
    }

    // Get cross-business patterns
    const allBusinesses = await db.query.businesses.findMany({
      with: {
        reports: true,
        timeEntries: true
      }
    });

    // Generate insights
    const insights: AIInsights = {
      businessId,
      predictions: await this.generatePredictions(businessData),
      recommendations: await this.generateRecommendations(businessData, allBusinesses),
      anomalies: await this.detectAnomalies(businessData)
    };

    return insights;
  }

  private static async generatePredictions(businessData: any) {
    // Simple moving average for revenue prediction
    const revenueHistory = businessData.reports
      .sort((a: any, b: any) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
      .map((r: any) => r.revenue || 0);

    // Simple forecast
    const lastRevenue = revenueHistory[revenueHistory.length - 1] || 0;
    const forecast = Array(6).fill(0).map((_, i) => ({
      date: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.round(lastRevenue * (1 + (Math.random() * 0.1 - 0.05)) * 100) / 100
    }));

    return {
      revenueForecast: forecast,
      busyPeriods: this.identifyBusyPeriods(businessData.timeEntries)
    };
  }

  private static identifyBusyPeriods(timeEntries: any[]) {
    const weeklyHours = timeEntries.reduce((acc: Record<string, number>, entry: any) => {
      const week = this.getWeekNumber(new Date(entry.date));
      acc[week] = (acc[week] || 0) + (entry.hours || 0);
      return acc;
    }, {});

    const threshold = Math.max(...Object.values(weeklyHours), 0) * 0.8;
    return Object.entries(weeklyHours)
      .filter(([_, hours]) => (hours as number) >= threshold)
      .map(([week, intensity]) => {
        const date = new Date();
        date.setDate(date.getDate() + (parseInt(week) * 7));
        return {
          start: date.toISOString().split('T')[0],
          end: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          intensity: Math.min(1, (intensity as number) / (threshold || 1))
        };
      });
  }

  private static async generateRecommendations(businessData: any, allBusinesses: any[]) {
    const recommendations: string[] = [];
    
    // Time tracking analysis
    if (businessData.timeEntries?.length > 0) {
      const projectCount = new Set(businessData.timeEntries.map((t: any) => t.projectId)).size;
      const avgHoursPerProject = businessData.timeEntries.length / (projectCount || 1);
      
      if (avgHoursPerProject < 20) {
        recommendations.push("Consider increasing project focus - average hours per project is below typical threshold.");
      }
    }

    // Cross-business comparison
    if (businessData.industry) {
      const similarBusinesses = allBusinesses.filter((b: any) => 
        b.industry === businessData.industry && 
        b.id !== businessData.id
      );

      if (similarBusinesses.length > 0 && businessData.reports?.[0]?.revenue) {
        const avgRevenue = similarBusinesses.reduce((sum: number, b: any) => 
          sum + ((b.reports?.[0]?.revenue) || 0), 0) / similarBusinesses.length;
        
        if (businessData.reports[0].revenue < avgRevenue * 0.8) {
          recommendations.push(`Your revenue is below average for similar businesses in ${businessData.industry}. Consider reviewing pricing or marketing strategies.`);
        }
      }
    }

    return recommendations.length > 0 ? recommendations : ["No specific recommendations at this time."];
  }

  private static async detectAnomalies(businessData: any) {
    const anomalies = [];

    // Detect revenue drops
    if (businessData.reports?.length >= 3) {
      const recentRevenue = [...businessData.reports]
        .sort((a: any, b: any) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())
        .slice(0, 3)
        .map((r: any) => r.revenue || 0);

      if (recentRevenue[0] < recentRevenue[1] * 0.7) {
        anomalies.push({
          type: "Revenue Drop",
          description: `Significant revenue drop detected (${((1 - recentRevenue[0]/(recentRevenue[1] || 1)) * 100).toFixed(0)}% decrease)`,
          impact: "high" as const
        });
      }
    }

    return anomalies;
  }

  private static getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
