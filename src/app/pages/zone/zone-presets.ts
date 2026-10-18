import { FormGroup, Validators } from "@angular/forms"

import { positiveInteger } from "@app/utils"

export type ZonePreset = "tamper" | "instant" | "delayed"

const zonePresetValues = {
  tamper: {
    disarmedDelay: 0,
    awayAlertDelay: 0,
    awayArmDelay: 0,
    stayAlertDelay: 0,
    stayArmDelay: 0
  },
  instant: {
    disarmedDelay: null,
    awayAlertDelay: 0,
    awayArmDelay: 0,
    stayAlertDelay: 0,
    stayArmDelay: 0
  },
  delayed: {
    disarmedDelay: null,
    awayAlertDelay: 30,
    awayArmDelay: 30,
    stayAlertDelay: 30,
    stayArmDelay: 30
  }
} satisfies Record<ZonePreset, Record<string, number | null>>

export function applyZonePresetToForm(form: FormGroup, preset: ZonePreset): void {
  const values = zonePresetValues[preset]
  form.patchValue({
    disarmedAlert: values.disarmedDelay !== null,
    disarmedDelay: values.disarmedDelay,
    awayArmedAlert: values.awayAlertDelay !== null,
    awayAlertDelay: values.awayAlertDelay,
    awayArmDelay: values.awayArmDelay,
    stayArmedAlert: values.stayAlertDelay !== null,
    stayAlertDelay: values.stayAlertDelay,
    stayArmDelay: values.stayArmDelay
  })

  const delayControls = [
    ["disarmedDelay", values.disarmedDelay !== null],
    ["awayAlertDelay", values.awayAlertDelay !== null],
    ["awayArmDelay", values.awayAlertDelay !== null],
    ["stayAlertDelay", values.stayAlertDelay !== null],
    ["stayArmDelay", values.stayAlertDelay !== null]
  ] as const

  delayControls.forEach(([controlName, enabled]) => {
    const control = form.controls[controlName]
    control.setValidators(enabled ? [Validators.required, positiveInteger()] : null)
    control.updateValueAndValidity({ onlySelf: true })
  })

  form.updateValueAndValidity()
}

export function zonePresetMatchesForm(form: FormGroup, preset: ZonePreset): boolean {
  const values = zonePresetValues[preset]
  if (preset === "delayed") {
    const armedDelayControls = ["awayAlertDelay", "awayArmDelay", "stayAlertDelay", "stayArmDelay"]

    return (
      !form.controls.disarmedAlert.value &&
      armedDelayControls.some(controlName => Number(form.controls[controlName].value) > 0)
    )
  }

  const alertValues: Array<[string, boolean]> = [
    ["disarmedAlert", values.disarmedDelay !== null],
    ["awayArmedAlert", values.awayAlertDelay !== null],
    ["stayArmedAlert", values.stayAlertDelay !== null]
  ]
  const delayValues: Array<[string, number | null]> = [
    ["disarmedDelay", values.disarmedDelay],
    ["awayAlertDelay", values.awayAlertDelay],
    ["awayArmDelay", values.awayArmDelay],
    ["stayAlertDelay", values.stayAlertDelay],
    ["stayArmDelay", values.stayArmDelay]
  ]

  return (
    alertValues.every(([controlName, expected]) => form.controls[controlName].value === expected) &&
    delayValues.every(([controlName, expected]) => {
      const actual = form.controls[controlName].value
      if (actual === null || actual === undefined || actual === "") {
        return expected === null
      }

      return Number.isFinite(Number(actual)) && Number(actual) === expected
    })
  )
}
