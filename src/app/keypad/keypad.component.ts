import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { EventService, KeypadService, LoaderService, MonitoringService } from '../services';
import { Keypad, KeypadType } from '../models';

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
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,

    private fb: FormBuilder,
    private keypadService: KeypadService,
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
    if (this.keypad){
      this.keypadForm = this.fb.group( {
        keypad_enabled: this.keypad.enabled,
        keypad_type: new FormControl(this.keypad.type_id, Validators.required),
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

    this.keypadService.getKeypad(0)
    .subscribe(keypad => {
      this.keypad = keypad;
      this.updateForm();
    });

    this.keypadService.getKeypadTypes()
    .subscribe(keypadTypes => {
      this.keypadTypes = keypadTypes;
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
      type_id: formModel.keypad_type
    };
  }

  onSubmit() {
    this.keypadService.updateKeypad(this.prepareKeypad())
      .subscribe(_ => this.updateComponent());
  }
}

