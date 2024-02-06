import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';

import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { OutputDeleteDialogComponent } from './output-delete.component';
import { Area, MONITORING_STATE, Output, OutputType, OutputDefinitions, OutputTriggerType } from '../models';
import { AreaService, AuthenticationService, EventService, LoaderService, MonitoringService, OutputService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'output-list.component.html',
  styleUrls: ['output-list.component.scss'],
  providers: []
})

export class OutputListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  @Input() onlyAlerting = false;

  action: string;
  outputs: Output[] = null;
  areas: Area[] = [];
  outputTypes = OutputType;
  outputTriggerTypes = OutputTriggerType;
  isDragging = false;

  constructor(
    @Inject('AreaService') public areaService: AreaService,
    @Inject('AuthenticationService') public authService: AuthenticationService,
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
    this.baseSubscriptions.push(
      this.eventService.listen('outputs_state_change')
        .subscribe(_ => this.updateComponent())
    );
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent() {
    if (this.isDragging)
      return;

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
      }
      );
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(outputId: number) {
    const dialogRef = this.dialog.open(OutputDeleteDialogComponent, {
      width: '250px',
      data: {
        description: this.outputs.find(x => x.id === outputId).description,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.action = 'delete';
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.outputService.deleteOutput(outputId)
            .subscribe(_ => this.updateComponent(),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration });
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
