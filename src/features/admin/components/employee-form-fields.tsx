'use client'

import { Loader2, Plus } from 'lucide-react'
import type { AdminEmployeeFormOptions } from '@/features/admin/types'

type ApproverOption = { id: string; label: string }

type EmployeeFormState = {
  employeeId: string
  employeeName: string
  employeeEmail: string
  loginPassword: string
  designationId: string
  employeeStatusId: string
  roleId: string
  stateId: string
  approvalEmployeeIdLevel1: string
  approvalEmployeeIdLevel2: string
  approvalEmployeeIdLevel3: string
}

type EmployeeFormFieldsProps = {
  form: EmployeeFormState
  options: AdminEmployeeFormOptions
  selectedDesignationId: string
  selectedRoleId: string
  selectedStateId: string
  selectedEmployeeStatusId: string
  enablePasswordLogin: boolean
  isSubmitting: boolean
  isLoadingApprovers: boolean
  level1Options: ApproverOption[]
  level2Options: ApproverOption[]
  level3Options: ApproverOption[]
  ruleLabelsByLevel: { level1: string[]; level2: string[]; level3: string[] }
  inputClassName: string
  selectClassName: string
  onFieldChange: (field: keyof EmployeeFormState, value: string) => void
  onTogglePasswordLogin: (enabled: boolean) => void
}

export function EmployeeFormFields({
  form,
  options,
  selectedDesignationId,
  selectedRoleId,
  selectedStateId,
  selectedEmployeeStatusId,
  enablePasswordLogin,
  isSubmitting,
  isLoadingApprovers,
  level1Options,
  level2Options,
  level3Options,
  ruleLabelsByLevel,
  inputClassName,
  selectClassName,
  onFieldChange,
  onTogglePasswordLogin,
}: EmployeeFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium text-foreground">
          Employee ID
          <input
            required
            value={form.employeeId}
            onChange={(event) =>
              onFieldChange('employeeId', event.currentTarget.value)
            }
            className={`${inputClassName} mt-1`}
            placeholder="e.g. NXT-EMP-1001"
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Full Name
          <input
            required
            value={form.employeeName}
            onChange={(event) =>
              onFieldChange('employeeName', event.currentTarget.value)
            }
            className={`${inputClassName} mt-1`}
            placeholder="Employee full name"
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Email
          <input
            required
            type="email"
            value={form.employeeEmail}
            onChange={(event) =>
              onFieldChange('employeeEmail', event.currentTarget.value)
            }
            className={`${inputClassName} mt-1`}
            placeholder="name@nxtwave.co.in"
          />
        </label>

        <div className="block text-sm font-medium text-foreground">
          Create Password Login Account
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePasswordLogin(true)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                enablePasswordLogin
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onTogglePasswordLogin(false)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !enablePasswordLogin
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              No
            </button>
          </div>
          {enablePasswordLogin ? (
            <input
              type="password"
              value={form.loginPassword}
              onChange={(event) =>
                onFieldChange('loginPassword', event.currentTarget.value)
              }
              className={`${inputClassName} mt-2`}
              placeholder="Set password for email login"
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
            />
          ) : null}
        </div>

        <label className="block text-sm font-medium text-foreground">
          Designation
          <select
            required
            value={selectedDesignationId}
            onChange={(event) =>
              onFieldChange('designationId', event.currentTarget.value)
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">Select designation</option>
            {options.designations.map((designation) => (
              <option key={designation.id} value={designation.id}>
                {designation.designation_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Employee Status
          <select
            required
            value={selectedEmployeeStatusId}
            onChange={(event) =>
              onFieldChange('employeeStatusId', event.currentTarget.value)
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">Select status</option>
            {options.statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Role
          <select
            required
            value={selectedRoleId}
            onChange={(event) =>
              onFieldChange('roleId', event.currentTarget.value)
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">Select role</option>
            {options.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground sm:col-span-2 lg:col-span-1">
          Primary State
          <select
            required
            value={selectedStateId}
            onChange={(event) =>
              onFieldChange('stateId', event.currentTarget.value)
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">Select state</option>
            {options.states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.state_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-foreground">
          Level 1 Approver (optional)
          <select
            value={form.approvalEmployeeIdLevel1}
            onChange={(event) =>
              onFieldChange(
                'approvalEmployeeIdLevel1',
                event.currentTarget.value
              )
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">None</option>
            {level1Options.map((approver) => (
              <option key={approver.id} value={approver.id}>
                {approver.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Level 2 Approver (optional)
          <select
            value={form.approvalEmployeeIdLevel2}
            onChange={(event) =>
              onFieldChange(
                'approvalEmployeeIdLevel2',
                event.currentTarget.value
              )
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">None</option>
            {level2Options.map((approver) => (
              <option key={approver.id} value={approver.id}>
                {approver.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Level 3 Approver (optional)
          <select
            value={form.approvalEmployeeIdLevel3}
            onChange={(event) =>
              onFieldChange(
                'approvalEmployeeIdLevel3',
                event.currentTarget.value
              )
            }
            className={`${selectClassName} mt-1`}
          >
            <option value="">None</option>
            {level3Options.map((approver) => (
              <option key={approver.id} value={approver.id}>
                {approver.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {form.stateId && !isLoadingApprovers && level1Options.length === 0 && (
        <p className="text-sm text-amber-600">
          No eligible Level 1 approver found for this state.
          {ruleLabelsByLevel.level1.length > 0
            ? ` Expected designation: ${ruleLabelsByLevel.level1.join(', ')}.`
            : ''}
        </p>
      )}

      {form.stateId && !isLoadingApprovers && level2Options.length === 0 && (
        <p className="text-sm text-amber-600">
          No eligible Level 2 approver found for this state.
          {ruleLabelsByLevel.level2.length > 0
            ? ` Expected designation: ${ruleLabelsByLevel.level2.join(', ')}.`
            : ''}
        </p>
      )}

      {form.stateId && !isLoadingApprovers && level3Options.length === 0 && (
        <p className="text-sm text-amber-600">
          No eligible Level 3 approver found.
          {ruleLabelsByLevel.level3.length > 0
            ? ` Expected designation: ${ruleLabelsByLevel.level3.join(', ')}.`
            : ''}
        </p>
      )}

      {form.stateId && isLoadingApprovers && (
        <p className="text-sm text-muted-foreground">
          Loading approvers for selected state...
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isSubmitting ? 'Creating...' : 'Create Employee'}
        </button>
      </div>
    </>
  )
}
