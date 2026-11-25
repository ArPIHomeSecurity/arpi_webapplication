import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from "@angular/core"
import { FormGroup, Validators } from "@angular/forms"
import { Subscription } from "rxjs"

import {
  applyZonePresetToForm,
  ZonePreset,
  zonePresetMatchesForm
} from "@app/pages/zone/zone-presets"
import { positiveInteger } from "@app/utils"

@Component({
  selector: "app-zone-configuration",
  templateUrl: "./zone-configuration.component.html",
  styleUrls: ["./zone-configuration.component.scss"],
  standalone: false
})
export class ZoneConfigurationComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) form: FormGroup
  @Input() nameControlName = "name"
  @Input() nameLabel = "Name"
  @Input() namePlaceholder?: string
  @Input() descriptionControlName?: string
  @Input() showPresets = true
  @Input() selectedPreset: ZonePreset | null = "instant"
  @Output() selectedPresetChange = new EventEmitter<ZonePreset | null>()

  activePreset: ZonePreset | null = null
  private formSubscription: Subscription

  ngOnChanges(changes: SimpleChanges) {
    if (changes["form"] && this.form) {
      this.formSubscription?.unsubscribe()
      this.formSubscription = this.form.valueChanges.subscribe(() => {
        if (this.activePreset && !zonePresetMatchesForm(this.form, this.activePreset)) {
          this.activePreset = null
          this.selectedPresetChange.emit(null)
        }
      })
    }

    if (changes["selectedPreset"] && this.selectedPreset !== this.activePreset) {
      this.activePreset = this.selectedPreset
      if (this.activePreset && this.showPresets) {
        applyZonePresetToForm(this.form, this.activePreset)
      }
    }
  }

  ngOnDestroy() {
    this.formSubscription?.unsubscribe()
  }

  onPresetChanged(preset: ZonePreset) {
    this.activePreset = preset
    this.selectedPresetChange.emit(preset)
    applyZonePresetToForm(this.form, preset)
  }

  alertWhenChanged(checked: boolean, delayControlName: string) {
    const delayControl = this.form.get(delayControlName)!
    if (checked) {
      delayControl.setValidators([Validators.required, positiveInteger()])
    } else {
      delayControl.clearValidators()
    }

    delayControl.updateValueAndValidity()
  }
}
