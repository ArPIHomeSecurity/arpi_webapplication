import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';

import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Area, MONITORING_STATE, Output, OutputDefinitions, OutputTriggerType, OutputType } from '@app/models';
import {
  AreaService,
  AuthenticationService,
  EventService,
  LoaderService,
  MonitoringService,
  OutputService,
  ZoneService
} from '@app/services';

import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'output-list.component.html',
  styleUrls: ['output-list.component.scss'],
  providers: [],
  standalone: false
})
export class OutputListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;

  outputs: Output[] = null;
  areas: Area[] = [];
  outputTypes = OutputType;
  outputTriggerTypes = OutputTriggerType;
  isDragging = false;

  constructor(
    @Inject('AreaService') public areaService: AreaService,
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('OutputService') private outputService: OutputService,
    @Inject('ZoneService') private zoneService: ZoneService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG);

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });
    this.updateComponent();

    // TODO: update only one output instead of the whole page
    this.baseSubscriptions.push(this.eventService.listen('output_state_change').subscribe(_ => this.updateComponent()));
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent() {
    if (this.isDragging) return;

    forkJoin({
      outputs: this.outputService.getOutputs(),
      areas: this.areaService.getAreas()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.outputs = results.outputs.sort((a, b) => a.uiOrder - b.uiOrder);
        this.areas = results.areas;
        this.loader.display(false);
        this.loader.disable(false);
      });
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(outputId: number) {
    const output = this.outputs.find(x => x.id === outputId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete output:Delete Output`,
        message: $localize`:@@delete output message:Are you sure you want to delete the output "${output.name}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.outputService
            .deleteOutput(outputId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@output deleted:Output deleted!`, null, {
                  duration: environment.snackDuration
                });
                this.updateComponent();
              },
              error: _ =>
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
                  duration: environment.snackDuration
                })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, {
            duration: environment.snackDuration
          });
        }
      }
    });
  }

  getOutputType(channel: number): OutputType {
    if (channel) {
      return OutputDefinitions.get(channel).type;
    }
  }

  getOutputLabel(channel: number): string {
    if (channel) {
      return OutputDefinitions.get(channel).label;
    }
  }

  getAreaName(areaId: number): string {
    if (this.areas.length && areaId != null) {
      return this.areas.find(x => x.id === areaId).name;
    }

    return '';
  }

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.outputs, event.previousIndex, event.currentIndex);
    this.outputs.forEach((output, index) => {
      output.uiOrder = index;
    });

    this.outputService.reorder(this.outputs);
    this.isDragging = false;
    // delayed update
    setTimeout(() => this.updateComponent(), 500);
  }
}
