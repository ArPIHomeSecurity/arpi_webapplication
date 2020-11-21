import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { Keypad, KeypadType } from '../models';
import { EventService, KeypadService, LoaderService, MonitoringService } from '../services';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
  templateUrl: 'keypad.component.html',
  styleUrls: ['keypad.component.scss'],
  providers: []
} )


export class KeypadComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  keypadForm: FormGroup;
  keypad: Keypad = null;
  keypadTypes: KeypadType[];

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('KeypadService') private keypadService: KeypadService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: FormBuilder,
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm() {
    if (this.keypad) {
      this.keypadForm = this.fb.group( {
        keypadEnabled: this.keypad.enabled,
        keypadType: new FormControl(this.keypad.typeId, Validators.required),
      });
    }

    if (this.keypad && this.keypadTypes) {
      this.loader.display(false);
    }
  }

  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display( true );
    } );

    forkJoin({
      keypad: this.keypadService.getKeypad(0),
      keypadTypes: this.keypadService.getKeypadTypes()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results =>{
      this.keypad = results.keypad;
      this.keypadTypes = results.keypadTypes;
      this.updateForm();
    });
  }

  prepareKeypad(): Keypad {
    const formModel = this.keypadForm.value;
    if (!this.keypad.id) {
      this.keypad.id = 1;
    }

    return {
      id: this.keypad.id,
      enabled: formModel.keypad_enabled,
      typeId: formModel.keypad_type
    };
  }

  onSubmit() {
    this.keypadService.updateKeypad(this.prepareKeypad())
      .subscribe(_ => this.updateComponent());
  }
}

