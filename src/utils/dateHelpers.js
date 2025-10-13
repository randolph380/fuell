// Utility functions for date manipulation and formatting

class DateHelpers {
  // Get current date
  static getCurrentDate() {
    return new Date();
  }

  // Format date for display
  static formatDate(date, format = 'short') {
    const dateObj = new Date(date);
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      case 'datetime':
        return dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      case 'iso':
        return dateObj.toISOString().split('T')[0];
      default:
        return dateObj.toLocaleDateString();
    }
  }

  // Get start of day
  static getStartOfDay(date) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }

  // Get end of day
  static getEndOfDay(date) {
    const dateObj = new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  }

  // Add days to date
  static addDays(date, days) {
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  }

  // Subtract days from date
  static subtractDays(date, days) {
    return this.addDays(date, -days);
  }

  // Get date range for a week
  static getWeekRange(date) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const startOfWeek = this.subtractDays(dateObj, dayOfWeek);
    const endOfWeek = this.addDays(startOfWeek, 6);
    
    return {
      start: this.getStartOfDay(startOfWeek),
      end: this.getEndOfDay(endOfWeek),
    };
  }

  // Get date range for a month
  static getMonthRange(date) {
    const dateObj = new Date(date);
    const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    
    return {
      start: this.getStartOfDay(startOfMonth),
      end: this.getEndOfDay(endOfMonth),
    };
  }

  // Check if two dates are the same day
  static isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Check if date is today
  static isToday(date) {
    return this.isSameDay(date, this.getCurrentDate());
  }

  // Check if date is yesterday
  static isYesterday(date) {
    const yesterday = this.subtractDays(this.getCurrentDate(), 1);
    return this.isSameDay(date, yesterday);
  }

  // Check if date is tomorrow
  static isTomorrow(date) {
    const tomorrow = this.addDays(this.getCurrentDate(), 1);
    return this.isSameDay(date, tomorrow);
  }

  // Get relative date string
  static getRelativeDateString(date) {
    if (this.isToday(date)) {
      return 'Today';
    } else if (this.isYesterday(date)) {
      return 'Yesterday';
    } else if (this.isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return this.formatDate(date, 'short');
    }
  }

  // Get days between two dates
  static getDaysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Get array of dates between two dates
  static getDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    
    return dates;
  }

  // Get week number
  static getWeekNumber(date) {
    const dateObj = new Date(date);
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const days = Math.floor((dateObj - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // Get month name
  static getMonthName(date, format = 'long') {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      month: format === 'short' ? 'short' : 'long' 
    });
  }

  // Get day name
  static getDayName(date, format = 'long') {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      weekday: format === 'short' ? 'short' : 'long' 
    });
  }

  // Parse date from string
  static parseDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Get time ago string
  static getTimeAgo(date) {
    const now = this.getCurrentDate();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  // Sort dates
  static sortDates(dates, ascending = true) {
    return dates.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  // Get next occurrence of a day of week
  static getNextDayOfWeek(date, dayOfWeek) {
    const dateObj = new Date(date);
    const currentDay = dateObj.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    return this.addDays(dateObj, daysUntilTarget);
  }

  // Get previous occurrence of a day of week
  static getPreviousDayOfWeek(date, dayOfWeek) {
    const dateObj = new Date(date);
    const currentDay = dateObj.getDay();
    const daysSinceTarget = (currentDay - dayOfWeek + 7) % 7;
    return this.subtractDays(dateObj, daysSinceTarget);
  }
}

export default DateHelpers;


