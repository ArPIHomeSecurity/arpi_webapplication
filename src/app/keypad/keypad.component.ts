import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { AuthenticationService, EventService, KeypadService, LoaderService, MonitoringService } from '../services';
import { Keypad, KeypadType } from '../models';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
  moduleId: module.id,
  templateUrl: 'keypad.component.html',
  styleUrls: ['keypad.component.scss'],
  providers: []
} )


export class KeypadComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  keypadForm: FormGroup;
  keypad: Keypad = null;
  keypadTypes: KeypadType[];

  constructor(
    public authService: AuthenticationService,
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    public router: Router,

    private fb: FormBuilder,
    private keypadService: KeypadService,
  ) {
    super(authService, eventService, loader, monitoringService, router);
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
    }, error => {
      if (error.status == 403) {
        super.logout();
      }
      else {
        this.keypad = new Keypad();
        this.updateForm();
      }
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
      .subscribe(_ => this.updateComponent(),
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
  }
}

