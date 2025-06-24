import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Keypad, KeypadType } from '@app/models';
import { EventService, KeypadService, LoaderService, MonitoringService } from '@app/services';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
    templateUrl: 'keypad.component.html',
    styleUrls: ['keypad.component.scss'],
    providers: [],
    standalone: false
} )


export class KeypadComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  keypadForm: UntypedFormGroup;
  keypad: Keypad = null;
  keypadTypes: KeypadType[];

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('KeypadService') private keypadService: KeypadService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });
    this.updateComponent();
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm() {
    if (this.keypad) {
      this.keypadForm = this.fb.group( {
        keypadEnabled: this.keypad.enabled,
        keypadType: new UntypedFormControl(this.keypad.typeId, Validators.required),
      });
    }
  }

  updateComponent() {
    this.keypadService.getKeypads().subscribe(
      keypads => {
        forkJoin({
          keypad: this.keypadService.getKeypad(keypads[0].id),
          keypadTypes: this.keypadService.getKeypadTypes()
        })
        .pipe(finalize(() => this.loader.display(false)))
        .subscribe(results =>{
          this.keypad = results.keypad;
          this.keypadTypes = results.keypadTypes;
          this.updateForm();
          this.loader.display(false);
          this.loader.disable(false);
        });
      },
      _ => this.loader.display(false)
    );

  }

  prepareKeypad(): Keypad {
    const formModel = this.keypadForm.value;
    if (!this.keypad.id) {
      this.keypad.id = 1;
    }

    return {
      id: this.keypad.id,
      enabled: formModel.keypadEnabled,
      typeId: formModel.keypadType
    };
  }

  onSubmit() {
    this.loader.disable(true);
    this.keypadService.updateKeypad(this.prepareKeypad())
      .subscribe(_ => this.updateComponent());
  }
}

