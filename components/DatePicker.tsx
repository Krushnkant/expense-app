import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DatePicker({
  visible,
  onClose,
  selectedDate,
  onDateSelect,
  title = 'Select Date',
  minDate,
  maxDate,
}: DatePickerProps) {
  const { state: themeState } = useTheme();
  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day).toISOString().split('T')[0];
      days.push(dateString);
    }

    return days;
  };

  const isDateDisabled = (dateString: string) => {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;

    if (min && date < min) return true;
    if (max && date > max) return true;

    return false;
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isSelected = (dateString: string) => {
    if (!dateString) return false;
    return dateString === selectedDate;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDateSelect = (dateString: string) => {
    if (!isDateDisabled(dateString)) {
      onDateSelect(dateString);
      onClose();
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Calendar size={24} color={colors.primary} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Selected Date Display */}
          {selectedDate && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>Selected Date</Text>
              <Text style={styles.selectedDateText}>
                {formatDateForDisplay(selectedDate)}
              </Text>
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <ChevronLeft size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.monthYearText}>
              {formatMonthYear(currentMonth)}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map(day => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((dateString, index) => {
              if (!dateString) {
                return <View key={index} style={styles.emptyCell} />;
              }

              const disabled = isDateDisabled(dateString);
              const today = isToday(dateString);
              const selected = isSelected(dateString);
              const day = new Date(dateString).getDate();

              return (
                <TouchableOpacity
                  key={dateString}
                  style={[
                    styles.dayCell,
                    selected && styles.selectedDayCell,
                    today && !selected && styles.todayDayCell,
                    disabled && styles.disabledDayCell,
                  ]}
                  onPress={() => handleDateSelect(dateString)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.selectedDayText,
                      today && !selected && styles.todayDayText,
                      disabled && styles.disabledDayText,
                    ]}
                  >
                    {day}
                  </Text>
                  {today && (
                    <View style={styles.todayIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleDateSelect(new Date().toISOString().split('T')[0])}
            >
              <Text style={styles.quickActionText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  emptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
    position: 'relative',
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
  },
  todayDayCell: {
    backgroundColor: colors.borderLight,
  },
  disabledDayCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  disabledDayText: {
    color: colors.textTertiary,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});