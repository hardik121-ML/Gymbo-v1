/**
 * Date Range Selector Component
 *
 * Allows users to select a date range for PDF exports.
 * Supports presets (Last 30 days, Last 3 months, All time) and custom range.
 */

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { DateRangePreset } from '@/lib/pdf/types'

interface DateRangeSelectorProps {
  selectedRange: DateRangePreset
  customStartDate?: string
  customEndDate?: string
  onRangeChange: (range: DateRangePreset) => void
  onCustomDatesChange: (start: string, end: string) => void
  validationError?: string
}

export function DateRangeSelector({
  selectedRange,
  customStartDate = '',
  customEndDate = '',
  onRangeChange,
  onCustomDatesChange,
  validationError,
}: DateRangeSelectorProps) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Select Period</Label>

        {/* Radio buttons for presets */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRange"
              value="last30"
              checked={selectedRange === 'last30'}
              onChange={() => onRangeChange('last30')}
              className="w-4 h-4"
            />
            <span className="text-sm">Last 30 days</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRange"
              value="last90"
              checked={selectedRange === 'last90'}
              onChange={() => onRangeChange('last90')}
              className="w-4 h-4"
            />
            <span className="text-sm">Last 3 months</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRange"
              value="allTime"
              checked={selectedRange === 'allTime'}
              onChange={() => onRangeChange('allTime')}
              className="w-4 h-4"
            />
            <span className="text-sm">All time</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRange"
              value="custom"
              checked={selectedRange === 'custom'}
              onChange={() => onRangeChange('custom')}
              className="w-4 h-4"
            />
            <span className="text-sm">Custom range</span>
          </label>
        </div>
      </div>

      {/* Custom date inputs (shown when "Custom" is selected) */}
      {selectedRange === 'custom' && (
        <div className="space-y-3 pl-7">
          <div>
            <Label htmlFor="startDate" className="text-sm">
              From Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={customStartDate}
              max={today}
              onChange={(e) => onCustomDatesChange(e.target.value, customEndDate)}
              className="mt-1"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-sm">
              To Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={customEndDate}
              min={customStartDate || undefined}
              max={today}
              onChange={(e) => onCustomDatesChange(customStartDate, e.target.value)}
              className="mt-1"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <p className="text-sm text-destructive pl-7">{validationError}</p>
      )}
    </div>
  )
}
