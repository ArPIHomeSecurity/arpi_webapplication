import { Component, Inject, Input } from "@angular/core"
import { Output } from "@app/models"
import { AppPreferencesService, OutputService } from "@app/services"

@Component({
  selector: "component-output",
  templateUrl: "output.html",
  styleUrls: ["output.scss"],
  providers: [],
  standalone: false
})
export class OutputComponent {
  @Input() output!: Output
  @Input() disabled = false

  get longPressEnabled(): boolean {
    return this.appPreferencesService.longPressEnabled
  }

  ENDLESS_DURATION = 0

  longPressActive = false

  constructor(
    @Inject("OutputService") private outputService: OutputService,
    private appPreferencesService: AppPreferencesService
  ) {}

  onPressed() {
    this.toggleOutput()
  }

  onLongPressed() {
    this.toggleOutput()
  }

  private toggleOutput() {
    if (this.output.state) {
      this.outputService.deactivateOutput(this.output.id)
    } else {
      this.outputService.activateOutput(this.output.id)
    }
  }

  onLongPressAvailable(available: boolean) {
    this.longPressActive = available
  }
}
