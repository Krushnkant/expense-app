import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Calendar, ChevronDown, Tag, CircleUser as UserCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import DatePicker from '@/components/DatePicker';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  scopeFilter: 'all' | 'personal' | 'family';
  setScopeFilter: (scope: 'all' | 'personal' | 'family') => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  dateRangeFilter: 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom';
  setDateRangeFilter: (range: 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom') => void;
  memberFilter: string;
  setMemberFilter: (member: string) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  availableCategories: Array<{ name: string; color: string; icon: string }>;
  familyMembers: Array<{ id: string; name: string }>;
  getActiveFilterCount: () => number;
  clearAllFilters: () => void;
}

export default function FilterModal({
  visible,
  onClose,
  scopeFilter,
  setScopeFilter,
  categoryFilter,
  setCategoryFilter,
  dateRangeFilter,
  setDateRangeFilter,
  memberFilter,
  setMemberFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  availableCategories,
  familyMembers,
  getActiveFilterCount,
  clearAllFilters,
}: FilterModalProps) {
  const { state: themeState } = useTheme();
  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');

  const handleDatePickerOpen = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const handleDateSelect = (selectedDate: string) => {
    if (datePickerType === 'start') {
      setCustomStartDate(selectedDate);
      // If end date is set and is before the new start date, clear it
      if (customEndDate && selectedDate > customEndDate) {
        setCustomEndDate('');
      }
      if (dateRangeFilter !== 'custom') {
        setDateRangeFilter('custom');
      }
    } else {
      setCustomEndDate(selectedDate);
      if (dateRangeFilter !== 'custom') {
        setDateRangeFilter('custom');
      }
    }
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active Filters Count */}
          {getActiveFilterCount() > 0 && (
            <View style={styles.activeFiltersContainer}>
              <Text style={styles.activeFiltersText}>
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
              </Text>
            </View>
          )}

          {/* Scope Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Scope</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All' },
                { key: 'personal', label: 'Personal' },
                { key: 'family', label: 'Family' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    scopeFilter === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setScopeFilter(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    scopeFilter === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <TouchableOpacity 
              style={styles.categoryDropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <View style={styles.categoryDropdownContent}>
                <Tag size={16} color={colors.textTertiary} />
                <View style={styles.categoryDropdownTextContainer}>
                  <Text style={styles.categoryDropdownText}>
                    {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                  </Text>
                  {categoryFilter !== 'all' && (
                    <View style={styles.categoryIndicator}>
                      <View style={[
                        styles.categoryIndicatorDot, 
                        { backgroundColor: availableCategories.find(c => c.name === categoryFilter)?.color || '#6B7280' }
                      ]} />
                    </View>
                  )}
                </View>
                <ChevronDown 
                  size={16} 
                  color={colors.textTertiary}
                  style={[
                    styles.chevronIcon,
                    showCategoryDropdown && styles.chevronIconRotated
                  ]}
                />
              </View>
            </TouchableOpacity>
            
            {showCategoryDropdown && (
              <View style={styles.categoryDropdownList}>
                <TouchableOpacity
                  style={[
                    styles.categoryDropdownItem,
                    categoryFilter === 'all' && styles.categoryDropdownItemActive
                  ]}
                  onPress={() => {
                    setCategoryFilter('all');
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.categoryDropdownItemText,
                    categoryFilter === 'all' && styles.categoryDropdownItemTextActive
                  ]}>
                    All Categories
                  </Text>
                  {categoryFilter === 'all' && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {availableCategories.map(category => (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryDropdownItem,
                      categoryFilter === category.name && styles.categoryDropdownItemActive
                    ]}
                    onPress={() => {
                      setCategoryFilter(category.name);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <View style={styles.categoryDropdownItemContent}>
                      <View style={[styles.categoryDropdownDot, { backgroundColor: category.color }]} />
                      <Text style={[
                        styles.categoryDropdownItemText,
                        categoryFilter === category.name && styles.categoryDropdownItemTextActive
                      ]}>
                        {category.name}
                      </Text>
                    </View>
                    {categoryFilter === category.name && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              {[
                { key: 'today', label: 'Today', icon: Calendar },
                { key: 'yesterday', label: 'Yesterday', icon: Calendar },
                { key: 'last7days', label: 'Last 7 days', icon: Calendar },
                { key: 'thismonth', label: 'This Month', icon: Calendar },
                { key: 'custom', label: 'Custom Range', icon: Calendar },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dateRangeOption,
                    dateRangeFilter === option.key && styles.dateRangeOptionActive
                  ]}
                  onPress={() => {
                    if (option.key === 'custom') {
                      setDateRangeFilter('custom');
                      if (!customStartDate) {
                        handleDatePickerOpen('start');
                      }
                    } else {
                      setDateRangeFilter(option.key as any);
                    }
                  }}
                >
                  <View style={styles.dateRangeOptionContent}>
                    <option.icon 
                      size={16} 
                      color={dateRangeFilter === option.key ? '#FFFFFF' : colors.textTertiary} 
                    />
                    <Text style={[
                      styles.dateRangeOptionText,
                      dateRangeFilter === option.key && styles.dateRangeOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {dateRangeFilter === option.key && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {dateRangeFilter === 'custom' && (
              <View style={styles.customDateDisplay}>
                <Text style={styles.customDateLabel}>Selected Range:</Text>
                <View style={styles.customDateRange}>
                  <TouchableOpacity
                    style={styles.customDateButton}
                    onPress={() => handleDatePickerOpen('start')}
                  >
                    <Text style={styles.customDateText}>
                      {formatDateForDisplay(customStartDate)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.customDateSeparator}>to</Text>
                  <TouchableOpacity
                    style={styles.customDateButton}
                    onPress={() => handleDatePickerOpen('end')}
                  >
                    <Text style={styles.customDateText}>
                      {formatDateForDisplay(customEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Member Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Member</Text>
            <TouchableOpacity 
              style={styles.categoryDropdownButton}
              onPress={() => setShowMemberDropdown(!showMemberDropdown)}
            >
              <View style={styles.categoryDropdownContent}>
                <UserCircle size={16} color={colors.textTertiary} />
                <View style={styles.categoryDropdownTextContainer}>
                  <Text style={styles.categoryDropdownText}>
                    {memberFilter === 'all' ? 'All Members' : familyMembers.find(m => m.id === memberFilter)?.name || 'All Members'}
                  </Text>
                </View>
                <ChevronDown 
                  size={16} 
                  color={colors.textTertiary}
                  style={[
                    styles.chevronIcon,
                    showMemberDropdown && styles.chevronIconRotated
                  ]}
                />
              </View>
            </TouchableOpacity>
            
            {showMemberDropdown && (
              <View style={styles.categoryDropdownList}>
                <TouchableOpacity
                  style={[
                    styles.categoryDropdownItem,
                    memberFilter === 'all' && styles.categoryDropdownItemActive
                  ]}
                  onPress={() => {
                    setMemberFilter('all');
                    setShowMemberDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.categoryDropdownItemText,
                    memberFilter === 'all' && styles.categoryDropdownItemTextActive
                  ]}>
                    All Members
                  </Text>
                  {memberFilter === 'all' && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {familyMembers.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.categoryDropdownItem,
                      memberFilter === member.id && styles.categoryDropdownItemActive
                    ]}
                    onPress={() => {
                      setMemberFilter(member.id);
                      setShowMemberDropdown(false);
                    }}
                  >
                    <View style={styles.categoryDropdownItemContent}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.categoryDropdownItemText,
                        memberFilter === member.id && styles.categoryDropdownItemTextActive
                      ]}>
                        {member.name}
                      </Text>
                    </View>
                    {memberFilter === member.id && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        <DatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={datePickerType === 'start' ? customStartDate : customEndDate}
          onDateSelect={handleDateSelect}
          title={`Select ${datePickerType === 'start' ? 'Start' : 'End'} Date`}
          minDate={datePickerType === 'end' && customStartDate ? customStartDate : undefined}
          maxDate={new Date().toISOString().split('T')[0]}
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activeFiltersContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 32,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterOptionActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  categoryDropdownButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryDropdownTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  categoryDropdownList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    maxHeight: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryDropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  categoryDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryDropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  categoryDropdownItemTextActive: {
    color: colors.primary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateRangeOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateRangeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dateRangeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dateRangeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateRangeOptionTextActive: {
    color: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFFFFF',
  },
  customDateDisplay: {
    backgroundColor: colors.primaryLight,
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  customDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  customDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customDateButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  customDateSeparator: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: '#4facfe',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});