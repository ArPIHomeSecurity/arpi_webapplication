import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/forkJoin';

import { MatDialog, MatSnackBar } from '@angular/material';

import { FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

import { UserDeleteDialog } from './user-delete.component';
import { ArmType, User } from '../models/index';
import { EventService, LoaderService, MonitoringService, UserService} from '../services/index';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  moduleId: module.id,
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss'],
  providers: [MonitoringService, UserService]
})
export class UserDetailComponent implements OnInit {
  userId: number;
  user: User = null;
  userForm: FormGroup;
  ArmType:any = ArmType;
  roles: any = [];
  armState: ArmType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private eventService: EventService,
    private loader: LoaderService,
    private monitoringService: MonitoringService,
    private userService: UserService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private location: Location) {

    this.route.paramMap.subscribe(params =>
      this.userId = +params.get('id')
    );
  }

  ngOnInit() {
    for (let role in environment.ROLE_TYPES){
      this.roles.push({'name': role, 'value': environment.ROLE_TYPES[role]});
    }

    this.monitoringService.getArmState()
      .subscribe(armState => {
        this.armState = armState;
        if (this.userForm) {
          if (this.armState == ArmType.DISARMED) {
            this.userForm.enable();
          }
          else {
            this.userForm.disable();
          }
        }
      });
    this.eventService.listen('arm_state_change')
      .subscribe(arm_type => {
        if (arm_type === environment.ARM_DISARM) {
          this.armState = ArmType.DISARMED;
          this.userForm.enable();
        }
        else if (arm_type === environment.ARM_AWAY) {
          this.armState = ArmType.AWAY;
          this.userForm.disable();
        }
        else if (arm_type === environment.ARM_STAY) {
          this.armState = ArmType.STAY;
          this.userForm.disable();
        }
      });

    if (this.userId) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });

      this.userService.getUser(this.userId)
        .subscribe(user => {
            this.user = user;
            this.updateForm(this.user);
            this.loader.display(false);
        });
    }
    else {
      this.user = new User;
      this.user.name = null;
      this.user.role = 'user';
      this.user.access_code = null;
      this.updateForm(this.user);
    }
  }

  updateForm(user: User) {
    this.userForm = this.fb.group({
      name: user.name,
      role: user.role,
      accessCode: new FormControl(user.access_code, [Validators.pattern('^\\d{4,8}$')]),
    });

    if (this.armState != ArmType.DISARMED) {
      this.userForm.disable();
    }
  }

  onSubmit() {
    console.log('User: ', this.user);
    let user = this.prepareSaveUser();
    if (this.userId) {
      this.userService.updateUser(user).subscribe(null,
          _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
      );
    }
    else {
      this.userService.createUser(user).subscribe(null,
          _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION}));
    }
    this.router.navigate(['/users']);
  }

  onCancel() {
    this.location.back();
  }

  prepareSaveUser(): User {
    const formModel = this.userForm.value;

    let user: User = new User();
    user.id = this.userId;
    user.name = formModel.name; 
    user.role = formModel.role;
    user.access_code = formModel.accessCode;

    return user;
  }

  openDeleteDialog(userId: number) {
    let dialogRef = this.dialog.open(UserDeleteDialog, {
      width: '250px',
      data: {
        name: this.user.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(userId)
          .subscribe(result => this.router.navigate(['/users']),
              _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION}));
      }
    });
  }
}
